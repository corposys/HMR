import React, { useEffect, useMemo, useState } from 'react';
import { DoorOpen, Loader2, Search, Battery, AlertCircle, ShieldAlert, Calendar, User, Plus, RefreshCw, TriangleAlert, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useLocksOverview } from '@features/maintenance/hooks/useLocks';
import CreateLockEventModal from '@features/maintenance/components/CreateLockEventModal';

const LOCK_STATUS_STYLES = {
    operational: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    preventive: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
    failure: 'border-red-500/25 bg-red-500/10 text-red-400',
    out_of_service: 'border-zinc-500/25 bg-zinc-500/10 text-zinc-300',
};

const LOCK_STATUS_LABELS = {
    operational: 'Operativa',
    preventive: 'Preventiva',
    failure: 'Falla',
    out_of_service: 'Fuera de servicio',
};

const LOCK_CARD_MIN_WIDTH = 165;

const formatShortDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
};

const getUrgencyScore = (lock, prediction) => {
    if (lock.status === 'failure') return -300;
    if (lock.status === 'out_of_service') return -250;
    if (lock.status === 'preventive') return -150;
    if (!prediction) return 0;
    return prediction.days_remaining <= 0 ? prediction.days_remaining : Math.min(prediction.days_remaining, 100);
};

export default function LocksRackPage() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedLockId, setSelectedLockId] = useState(null);
    const [selectedLock, setSelectedLock] = useState(null);
    const [events, setEvents] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [savingEvent, setSavingEvent] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [expandedModules, setExpandedModules] = useState({});
    const [expandedFloors, setExpandedFloors] = useState({});
    const { locks, predictionsByRoom, loading, error, fetchLocksOverview } = useLocksOverview();

    useEffect(() => {
        fetchLocksOverview();
    }, [fetchLocksOverview]);

    useEffect(() => {
        if (selectedLockId) {
            return;
        }
        if (locks.length > 0) {
            setSelectedLockId(locks[0].id);
        }
    }, [locks, selectedLockId]);

    const fetchLockDetail = async (lockId) => {
        if (!lockId) {
            return;
        }
        setDetailLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/maintenance/locks/${lockId}/events`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error('No se pudo cargar historial de cerradura');
            }
            const payload = await response.json();
            setSelectedLock(payload.lock || null);
            setEvents(payload.events || []);
        } catch {
            setSelectedLock(null);
            setEvents([]);
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        fetchLockDetail(selectedLockId);
    }, [selectedLockId]);

    const filteredLocks = useMemo(() => {
        const q = search.trim().toLowerCase();
        return locks.filter((item) => {
            if (statusFilter !== 'all' && item.status !== statusFilter) {
                return false;
            }

            if (!q) {
                return true;
            }

            return (
                item.room_number?.toLowerCase().includes(q)
                || item.floor_code?.toLowerCase().includes(q)
                || item.module_name?.toLowerCase().includes(q)
                || (item.code || '').toLowerCase().includes(q)
            );
        });
    }, [locks, search, statusFilter]);

    const selectedPrediction = selectedLock ? predictionsByRoom[selectedLock.room_id] : null;

    const handleCreateEvent = async (data) => {
        setSavingEvent(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/maintenance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('No se pudo guardar el evento');
            }

            setShowCreate(false);
            await fetchLocksOverview();
            await fetchLockDetail(selectedLockId);
        } catch {
            // Fail silently for now, UI keeps previous state.
        } finally {
            setSavingEvent(false);
        }
    };

    const handleUpdateLockStatus = async (status) => {
        if (!selectedLockId || !selectedLock || selectedLock.status === status) {
            return;
        }

        setUpdatingStatus(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/maintenance/locks/${selectedLockId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            if (!response.ok) {
                throw new Error('No se pudo actualizar el estado');
            }
            await fetchLocksOverview();
            await fetchLockDetail(selectedLockId);
        } catch {
            // Keep current state if request fails.
        } finally {
            setUpdatingStatus(false);
        }
    };

    const groupedByFloor = useMemo(() => {
        const groups = {};
        filteredLocks.forEach((item) => {
            const key = `${item.module_id}-${item.floor_id}`;
            if (!groups[key]) {
                groups[key] = {
                    key,
                    moduleId: item.module_id,
                    moduleName: item.module_name,
                    moduleNumber: item.module_number,
                    floorId: item.floor_id,
                    floorCode: item.floor_code,
                    rooms: [],
                };
            }
            groups[key].rooms.push(item);
        });

        return Object.values(groups).sort((a, b) => {
            if (a.moduleId === b.moduleId) {
                return a.floorCode.localeCompare(b.floorCode, undefined, { numeric: true });
            }
            return a.moduleId - b.moduleId;
        });
    }, [filteredLocks]);

    const operationalSummary = useMemo(() => {
        const total = filteredLocks.length;
        const critical = filteredLocks.filter((item) => item.status === 'failure' || item.status === 'out_of_service').length;
        const preventive = filteredLocks.filter((item) => item.status === 'preventive').length;
        const healthy = filteredLocks.filter((item) => item.status === 'operational').length;
        const overdue = filteredLocks.filter((item) => {
            const prediction = predictionsByRoom[item.room_id];
            return item.status === 'failure' || item.status === 'out_of_service' || (prediction && prediction.days_remaining <= 0);
        }).length;

        return { total, critical, preventive, healthy, overdue };
    }, [filteredLocks, predictionsByRoom]);

    const priorityLocks = useMemo(() => {
        return [...filteredLocks]
            .map((item) => ({
                ...item,
                prediction: predictionsByRoom[item.room_id] || null,
            }))
            .filter((item) => item.status !== 'operational' || item.prediction?.days_remaining <= 15)
            .sort((a, b) => {
                const scoreA = getUrgencyScore(a, a.prediction);
                const scoreB = getUrgencyScore(b, b.prediction);
                if (scoreA !== scoreB) return scoreA - scoreB;
                return a.room_number.localeCompare(b.room_number, undefined, { numeric: true });
            })
            .slice(0, 8);
    }, [filteredLocks, predictionsByRoom]);

    const sortedGroupedByModule = useMemo(() => {
        const floors = groupedByFloor.map((group) => ({
            ...group,
            rooms: [...group.rooms]
                .map((item) => ({ ...item, prediction: predictionsByRoom[item.room_id] || null }))
                .sort((a, b) => {
                    return a.room_number.localeCompare(b.room_number, undefined, { numeric: true });
                }),
        }));

        const modules = {};
        floors.forEach((floor) => {
            const moduleKey = String(floor.moduleId);
            if (!modules[moduleKey]) {
                modules[moduleKey] = {
                    moduleId: floor.moduleId,
                    moduleName: floor.moduleName,
                    moduleNumber: floor.moduleNumber,
                    floors: [],
                };
            }
            modules[moduleKey].floors.push(floor);
        });

        return Object.values(modules)
            .sort((a, b) => a.moduleId - b.moduleId)
            .map((module) => ({
                ...module,
                floors: module.floors.sort((a, b) => a.floorCode.localeCompare(b.floorCode, undefined, { numeric: true })),
            }));
    }, [groupedByFloor, predictionsByRoom]);

    useEffect(() => {
        if (sortedGroupedByModule.length === 0) {
            return;
        }

        setExpandedModules((current) => {
            const next = { ...current };
            sortedGroupedByModule.forEach((module) => {
                const key = String(module.moduleId);
                if (!(key in next)) {
                    next[key] = true;
                }
            });
            return next;
        });

        setExpandedFloors((current) => {
            const next = { ...current };
            sortedGroupedByModule.forEach((module) => {
                module.floors.forEach((floor) => {
                    if (!(floor.key in next)) {
                        next[floor.key] = true;
                    }
                });
            });
            return next;
        });
    }, [sortedGroupedByModule]);

    const toggleModuleExpanded = (moduleId) => {
        const key = String(moduleId);
        setExpandedModules((current) => ({
            ...current,
            [key]: !current[key],
        }));
    };

    const toggleFloorExpanded = (floorKey) => {
        setExpandedFloors((current) => ({
            ...current,
            [floorKey]: !current[floorKey],
        }));
    };

    if (loading) {
        return (
            <div className="py-6 px-4 lg:px-8 w-full flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="py-6 px-4 lg:px-8 w-full">
            <div className="mx-auto max-w-auto space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[var(--color-primary)]/10 p-2.5">
                            <DoorOpen className="h-6 w-6 text-[var(--color-primary)]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Control de Cerraduras</h1>
                        </div>
                    </div>

                    <div className="relative w-full md:w-72">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar habitación, piso o módulo"
                            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-2 pl-9 pr-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                        />
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Total</p>
                        <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{operationalSummary.total}</p>
                    </div>
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-red-300">Críticas</p>
                        <p className="mt-1 text-2xl font-bold text-red-400">{operationalSummary.critical}</p>
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-amber-300">Preventivas</p>
                        <p className="mt-1 text-2xl font-bold text-amber-400">{operationalSummary.preventive}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-emerald-300">Operativas</p>
                        <p className="mt-1 text-2xl font-bold text-emerald-400">{operationalSummary.healthy}</p>
                    </div>
                </div>

                {priorityLocks.length > 0 && (
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                            <TriangleAlert className="h-4 w-4 text-red-400" />
                            Prioridades de hoy
                            <span className="text-xs font-normal text-[var(--color-text-muted)]">({priorityLocks.length})</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {priorityLocks.map((item) => {
                                const prediction = item.prediction;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedLockId(item.id)}
                                        className="inline-flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 transition-colors hover:border-red-400/40 hover:bg-red-500/15"
                                    >
                                        <span className="font-semibold">Hab. {item.room_number}</span>
                                        <span className="opacity-60">|</span>
                                        <span>{item.status === 'operational' ? 'Atención' : LOCK_STATUS_LABELS[item.status]}</span>
                                        <span className="opacity-60">|</span>
                                        <span>{prediction ? (prediction.days_remaining <= 0 ? 'Vencida' : `${prediction.days_remaining}d`) : 'Sin predicción'}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {groupedByFloor.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-10 text-center">
                        <p className="text-sm text-[var(--color-text-muted)]">No hay cerraduras para mostrar con los filtros actuales.</p>
                    </div>
                ) : (
                    <div className="grid items-start gap-4 xl:grid-cols-[1.35fr_1fr]">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2">
                                {[
                                    { value: 'all', label: 'Todas' },
                                    { value: 'operational', label: 'Operativas' },
                                    { value: 'preventive', label: 'Preventivas' },
                                    { value: 'failure', label: 'Falla' },
                                    { value: 'out_of_service', label: 'Fuera de servicio' },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setStatusFilter(option.value)}
                                        className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${statusFilter === option.value
                                            ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            {sortedGroupedByModule.map((module) => (
                                <section key={module.moduleId} className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90">
                                    <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/45 px-4 py-2.5">
                                        <button
                                            type="button"
                                            onClick={() => toggleModuleExpanded(module.moduleId)}
                                            className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-primary)]"
                                            aria-expanded={Boolean(expandedModules[String(module.moduleId)])}
                                            aria-label="Expandir o contraer módulo"
                                        >
                                            {expandedModules[String(module.moduleId)] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                            <DoorOpen className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                                            <span>{module.moduleName || `Módulo ${module.moduleNumber || module.moduleId}`}</span>
                                        </button>
                                        <span className="text-xs text-[var(--color-text-muted)]">Pisos: {module.floors.length}</span>
                                    </div>

                                    {expandedModules[String(module.moduleId)] && (
                                        <div className="space-y-3 p-3">
                                        {module.floors.map((group) => (
                                            <article key={group.key} className="overflow-hidden rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-primary)]/35">
                                                <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleFloorExpanded(group.key)}
                                                        className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-primary)]"
                                                        aria-expanded={Boolean(expandedFloors[group.key])}
                                                        aria-label="Expandir o contraer piso"
                                                    >
                                                        {expandedFloors[group.key] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                                        <span>{group.floorCode}</span>
                                                        <span className="text-[var(--color-text-muted)]">|</span>
                                                        <span className="text-[var(--color-text-secondary)]">{group.moduleName}</span>
                                                    </button>
                                                    <span className="text-xs text-[var(--color-text-muted)]">Habitaciones: {group.rooms.length}</span>
                                                </div>

                                                {expandedFloors[group.key] && (
                                                    <div
                                                        className="grid gap-2 p-2"
                                                        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${LOCK_CARD_MIN_WIDTH}px, 1fr))` }}
                                                    >
                                                        {group.rooms.map((item) => {
                                                            const prediction = item.prediction;
                                                            const statusKey = item.status || 'operational';
                                                            const statusClass = LOCK_STATUS_STYLES[statusKey] || LOCK_STATUS_STYLES.operational;
                                                            const statusLabel = LOCK_STATUS_LABELS[statusKey] || LOCK_STATUS_LABELS.operational;
                                                            const isSelected = selectedLockId === item.id;

                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    onClick={() => setSelectedLockId(item.id)}
                                                                    className={`group rounded-lg border bg-[var(--color-bg-primary)]/30 p-2 text-left transition-colors hover:border-[var(--color-primary)]/50 ${isSelected ? 'border-[var(--color-primary)]/60' : 'border-[var(--color-border)]'}`}
                                                                >
                                                                    <div className="mb-2 flex items-center justify-between gap-2">
                                                                        <span className="text-base font-semibold text-[var(--color-text-primary)]">{item.room_number}</span>
                                                                        <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${statusClass}`}>
                                                                            {statusLabel}
                                                                        </span>
                                                                    </div>

                                                                    <div className="space-y-1 text-[10px] text-[var(--color-text-muted)]">
                                                                        <div className="flex items-center gap-1">
                                                                            <Battery className="h-3 w-3" />
                                                                            <span>
                                                                                {prediction ? `Batería: ${prediction.health_score}%` : 'Sin predicción'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <ShieldAlert className="h-3 w-3" />
                                                                            <span>
                                                                                {prediction
                                                                                    ? (prediction.days_remaining <= 0
                                                                                        ? `${Math.abs(prediction.days_remaining)}d vencida`
                                                                                        : `${prediction.days_remaining}d restantes`)
                                                                                    : 'Sin histórico'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <AlertCircle className="h-3 w-3" />
                                                                            <span>{item.events_count || 0} eventos</span>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </article>
                                        ))}
                                        </div>
                                    )}
                                </section>
                            ))}
                        </div>

                        <aside className="h-fit self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                            {detailLoading ? (
                                <div className="flex min-h-[320px] items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
                                </div>
                            ) : !selectedLock ? (
                                <div className="flex min-h-[320px] items-center justify-center text-center text-sm text-[var(--color-text-muted)]">
                                    Selecciona una cerradura para ver su historial.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Hab. {selectedLock.room_number}</h3>
                                            <p className="text-xs text-[var(--color-text-muted)]">{selectedLock.module_name} · {selectedLock.floor_code}</p>
                                            <p className="text-[10px] text-[var(--color-text-muted)]">{selectedLock.code}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fetchLockDetail(selectedLockId)}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)]"
                                            title="Recargar historial"
                                        >
                                            <RefreshCw className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(LOCK_STATUS_LABELS).map(([value, label]) => {
                                            const active = selectedLock.status === value;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => handleUpdateLockStatus(value)}
                                                    disabled={updatingStatus}
                                                    className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors ${active
                                                        ? `${LOCK_STATUS_STYLES[value]} border`
                                                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/35 p-2 text-[10px] text-[var(--color-text-muted)]">
                                        <div>
                                            <p className="mb-0.5 uppercase tracking-wide">Salud batería</p>
                                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                                                {selectedPrediction ? `${selectedPrediction.health_score}%` : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="mb-0.5 uppercase tracking-wide">Próximo cambio</p>
                                            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                                                {selectedPrediction
                                                    ? (selectedPrediction.days_remaining <= 0
                                                        ? `${Math.abs(selectedPrediction.days_remaining)}d vencida`
                                                        : `${selectedPrediction.days_remaining}d restantes`)
                                                    : 'Sin datos'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreate(true)}
                                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 py-2 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Registrar evento
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowTimelineModal(true)}
                                            className="inline-flex flex-1 items-center justify-center rounded-lg border border-[var(--color-border)] py-2 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]"
                                        >
                                            Ver detalle
                                        </button>
                                    </div>

                                    <div className="rounded-lg border border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/30 p-2 text-xs text-[var(--color-text-muted)]">
                                        <div className="flex items-center justify-between gap-2">
                                            <span>Último mantenimiento</span>
                                            <span className="font-medium text-[var(--color-text-primary)]">{formatShortDate(selectedLock.last_maintenance_at)}</span>
                                        </div>
                                        <div className="mt-1 flex items-center justify-between gap-2">
                                            <span>Último tipo</span>
                                            <span className="font-medium text-[var(--color-text-primary)]">{selectedLock.last_maintenance_type || '—'}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Historial reciente</h4>

                                        {events.length === 0 ? (
                                            <p className="rounded-md border border-dashed border-[var(--color-border)] p-3 text-xs text-[var(--color-text-muted)]">
                                                Esta cerradura aún no tiene eventos registrados.
                                            </p>
                                        ) : (
                                            <div className="max-h-[360px] space-y-1.5 overflow-y-auto pr-1">
                                                {events.map((event) => (
                                                    <article key={event.id} className="rounded-md border border-[var(--color-border)]/80 bg-[var(--color-bg-primary)]/35 p-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${event.type === 'battery' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                                {event.type === 'battery' ? 'Batería' : 'Mecánico'}
                                                            </span>
                                                            <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {formatShortDate(event.performed_at)}
                                                            </span>
                                                        </div>
                                                        {event.part_name && (
                                                            <p className="mt-1 text-[10px] font-medium text-[var(--color-text-secondary)]">Pieza: {event.part_name}</p>
                                                        )}
                                                        {event.description && (
                                                            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{event.description}</p>
                                                        )}
                                                        {event.user_name && (
                                                            <p className="mt-1 text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                {event.user_name}
                                                            </p>
                                                        )}
                                                    </article>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </aside>
                    </div>
                )}
            </div>

            {showCreate && selectedLock && (
                <CreateLockEventModal
                    onSave={handleCreateEvent}
                    onCancel={() => setShowCreate(false)}
                    saving={savingEvent}
                    initialRoomId={selectedLock.room_id}
                    lockRoomSelection
                />
            )}

            {showTimelineModal && selectedLock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTimelineModal(false)} />
                    <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-2xl">
                        <button
                            type="button"
                            onClick={() => setShowTimelineModal(false)}
                            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]"
                            aria-label="Cerrar detalle"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="border-b border-[var(--color-border)] px-5 py-4 pr-14">
                            <h3 className="text-2xl font-semibold text-[var(--color-text-primary)]">Hab. {selectedLock.room_number}</h3>
                            <p className="text-sm text-[var(--color-text-secondary)]">{selectedLock.module_name} · {selectedLock.floor_code}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{selectedLock.code}</p>
                        </div>

                        <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/35 p-4">
                                <h4 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Predicción de batería</h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">Salud batería</p>
                                        <p className="text-xl font-bold text-[var(--color-text-primary)]">{selectedPrediction ? `${selectedPrediction.health_score}%` : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">Próximo cambio</p>
                                        <p className="text-xl font-bold text-[var(--color-text-primary)]">
                                            {selectedPrediction
                                                ? (selectedPrediction.days_remaining <= 0
                                                    ? `${Math.abs(selectedPrediction.days_remaining)}d vencida`
                                                    : `${selectedPrediction.days_remaining}d restantes`)
                                                : 'Sin datos'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/35">
                                <div className="border-b border-[var(--color-border)] px-4 py-3">
                                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Historial completo</h4>
                                    <p className="text-xs text-[var(--color-text-muted)]">{events.length} {events.length === 1 ? 'registro' : 'registros'}</p>
                                </div>

                                {events.length === 0 ? (
                                    <p className="p-4 text-sm text-[var(--color-text-muted)]">Esta cerradura aún no tiene eventos registrados.</p>
                                ) : (
                                    <div className="space-y-2 p-3">
                                        {events.map((event) => (
                                            <article key={event.id} className="rounded-lg border border-[var(--color-border)]/80 bg-[var(--color-bg-secondary)] p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${event.type === 'battery' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                        {event.type === 'battery' ? 'Batería' : 'Mecánico'}
                                                    </span>
                                                    <span className="text-[11px] text-[var(--color-text-muted)]">{formatShortDate(event.performed_at)}</span>
                                                </div>

                                                {event.part_name && (
                                                    <p className="mt-2 text-xs font-medium text-[var(--color-text-secondary)]">Pieza: {event.part_name}</p>
                                                )}
                                                {event.description && (
                                                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{event.description}</p>
                                                )}
                                                {event.user_name && (
                                                    <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">Técnico: {event.user_name}</p>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

