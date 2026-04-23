import React, { useEffect, useMemo, useState } from 'react';
import { DoorOpen, Loader2, Search, Battery, AlertCircle, ShieldAlert, Calendar, User, Plus, RefreshCw, TriangleAlert, ChevronDown, ChevronRight, X, Activity, BatteryFull } from 'lucide-react';
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
            // Ocultar habitaciones, pisos o módulos clausurados
            if (item.room_status === 'inactive' || item.module_is_active === false || item.floor_is_active === false) {
                return false;
            }

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
                const codeA = String(a.floorCode).toUpperCase();
                const codeB = String(b.floorCode).toUpperCase();
                if (codeA === 'PB') return -1;
                if (codeB === 'PB') return 1;
                return codeA.localeCompare(codeB, undefined, { numeric: true });
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
                floors: module.floors.sort((a, b) => {
                    const codeA = String(a.floorCode).toUpperCase();
                    const codeB = String(b.floorCode).toUpperCase();
                    if (codeA === 'PB') return -1;
                    if (codeB === 'PB') return 1;
                    return codeA.localeCompare(codeB, undefined, { numeric: true });
                }),
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

                        {groupedByFloor.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-10 text-center">
                                <p className="text-sm text-[var(--color-text-muted)]">No hay cerraduras para mostrar con los filtros actuales.</p>
                            </div>
                        ) : (
                            sortedGroupedByModule.map((module) => (
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
                            ))
                        )}
                    </div>

                        <aside className="h-fit self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 shadow-sm">
                            {detailLoading ? (
                                <div className="flex min-h-[400px] items-center justify-center">
                                    <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
                                </div>
                            ) : !selectedLock ? (
                                <div className="flex min-h-[400px] flex-col items-center justify-center gap-3 text-center text-sm text-[var(--color-text-muted)]">
                                    <div className="rounded-full bg-[var(--color-bg-primary)] p-4">
                                        <DoorOpen className="h-8 w-8 text-[var(--color-text-muted)] opacity-50" />
                                    </div>
                                    <p>Selecciona una cerradura para ver su historial y detalles.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                                <DoorOpen className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                                                    Hab. {selectedLock.room_number}
                                                    <span className="text-sm font-normal opacity-40 text-[var(--color-text-muted)]">|</span>
                                                    <span className="text-xs font-medium text-[var(--color-text-muted)]">{selectedLock.module_name} - {selectedLock.floor_code}</span>
                                                </h3>
                                                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] opacity-75">{selectedLock.code}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fetchLockDetail(selectedLockId)}
                                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]/50 text-[var(--color-text-muted)] transition-all hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5 hover:text-[var(--color-primary)]"
                                            title="Recargar historial"
                                        >
                                            <RefreshCw className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Status Tags */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                                            <AlertCircle className="h-3.5 w-3.5" />
                                            <span>Estado actual</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(LOCK_STATUS_LABELS).map(([value, label]) => {
                                                const active = selectedLock.status === value;
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        onClick={() => handleUpdateLockStatus(value)}
                                                        disabled={updatingStatus}
                                                        className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-all ${active
                                                            ? `${LOCK_STATUS_STYLES[value]} ring-1 ring-inset ring-current/20 shadow-sm`
                                                            : 'border-[var(--color-border)] bg-[var(--color-bg-primary)]/30 text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-primary)]'
                                                            }`}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Battery Info */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex flex-col justify-center rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/35 p-3.5">
                                            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                                                <BatteryFull className="h-3.5 w-3.5" />
                                                Salud batería
                                            </div>
                                            <div className="text-lg font-bold text-[var(--color-text-primary)]">
                                                {selectedPrediction ? `${selectedPrediction.health_score}%` : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col justify-center rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/35 p-3.5">
                                            <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                                                <Calendar className="h-3.5 w-3.5" />
                                                Próximo cambio
                                            </div>
                                            <div className="text-lg font-bold text-[var(--color-text-primary)]">
                                                {selectedPrediction
                                                    ? (selectedPrediction.days_remaining <= 0
                                                        ? <span className="text-red-400">{Math.abs(selectedPrediction.days_remaining)}d vencida</span>
                                                        : `${selectedPrediction.days_remaining}d restantes`)
                                                    : 'Sin datos'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowCreate(true)}
                                            className="group flex items-center justify-center gap-2 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 py-2.5 text-xs font-semibold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]/20 hover:border-[var(--color-primary)]/50 hover:shadow-sm"
                                        >
                                            <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
                                            Registrar evento
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowTimelineModal(true)}
                                            className="group flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/30 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)] hover:shadow-sm"
                                        >
                                            Ver detalle
                                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                        </button>
                                    </div>

                                    {/* Maintenance Summary */}
                                    <div className="rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/20 p-3">
                                        <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)]/50 pb-2 mb-2 text-xs">
                                            <span className="text-[var(--color-text-muted)] flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5"/> Último mantenimiento</span>
                                            <span className="font-semibold text-[var(--color-text-primary)]">{formatShortDate(selectedLock.last_maintenance_at)}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 text-xs">
                                            <span className="text-[var(--color-text-muted)] flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5"/> Último tipo</span>
                                            <span className="font-semibold text-[var(--color-text-primary)]">{selectedLock.last_maintenance_type || '—'}</span>
                                        </div>
                                    </div>

                                    {/* Recent History */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                Historial reciente
                                            </h4>
                                            <span className="text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-primary)] px-2 py-0.5 rounded-full">{events.length} {events.length === 1 ? 'evento' : 'eventos'}</span>
                                        </div>

                                        {events.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-primary)]/20 p-6 text-center text-xs text-[var(--color-text-muted)]">
                                                <Calendar className="h-6 w-6 opacity-30" />
                                                <p>Esta cerradura aún no tiene eventos registrados.</p>
                                            </div>
                                        ) : (
                                            <div className="max-h-[300px] space-y-2.5 overflow-y-auto pr-2 custom-scrollbar">
                                                {events.map((event) => (
                                                    <article key={event.id} className="group relative overflow-hidden rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-primary)]/40 p-3 transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-primary)]/60">
                                                        <div className="absolute left-0 top-0 h-full w-1 bg-transparent transition-colors group-hover:bg-[var(--color-primary)]/30" />
                                                        <div className="mb-2 flex items-center justify-between gap-2">
                                                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${event.type === 'battery' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                                {event.type === 'battery' ? <Battery className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                                                                {event.type === 'battery' ? 'Batería' : 'Mecánico'}
                                                            </span>
                                                            <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-muted)]">
                                                                <Calendar className="h-3 w-3" />
                                                                {formatShortDate(event.performed_at)}
                                                            </span>
                                                        </div>
                                                        {event.part_name && (
                                                            <div className="mb-1.5 flex items-start gap-1.5 text-xs text-[var(--color-text-secondary)]">
                                                                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)]/50 shrink-0" />
                                                                <span className="font-medium">Pieza: <span className="text-[var(--color-text-primary)]">{event.part_name}</span></span>
                                                            </div>
                                                        )}
                                                        {event.description && (
                                                            <p className="mb-2 pl-3 text-xs leading-relaxed text-[var(--color-text-secondary)] border-l-2 border-[var(--color-border)]/50">{event.description}</p>
                                                        )}
                                                        {event.user_name && (
                                                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--color-text-muted)] mt-2 pt-2 border-t border-[var(--color-border)]/50">
                                                                <User className="h-3 w-3" />
                                                                {event.user_name}
                                                            </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowTimelineModal(false)} />
                    <div className="relative z-10 w-full max-w-6xl flex max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-2xl">
                        
                        {/* Header */}
                        <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/30 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                    <DoorOpen className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                                        Hab. {selectedLock.room_number}
                                        <span className="text-sm font-normal opacity-40 text-[var(--color-text-muted)]">|</span>
                                        <span className="text-xs font-medium text-[var(--color-text-muted)]">{selectedLock.module_name} - {selectedLock.floor_code}</span>
                                    </h3>
                                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] opacity-75">{selectedLock.code}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTimelineModal(false)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]/50 text-[var(--color-text-muted)] transition-all hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)]"
                                aria-label="Cerrar detalle"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                            <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
                                {/* Left Column: Summary */}
                                <div className="space-y-5">
                                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 p-5">
                                        <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-primary)]" style={{ marginBottom: '16px' }}>
                                            <BatteryFull className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                                            Predicción de batería
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="flex flex-col justify-center rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/35 p-3.5">
                                                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                                                    <BatteryFull className="h-3.5 w-3.5" />
                                                    Salud batería
                                                </div>
                                                <div className="text-lg font-bold text-[var(--color-text-primary)]">
                                                    {selectedPrediction ? `${selectedPrediction.health_score}%` : 'N/A'}
                                                </div>
                                            </div>
                                            <div className="flex flex-col justify-center rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/35 p-3.5">
                                                <div className="flex items-center gap-1.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    Próximo cambio
                                                </div>
                                                <div className="text-lg font-bold text-[var(--color-text-primary)]">
                                                    {selectedPrediction
                                                        ? (selectedPrediction.days_remaining <= 0
                                                            ? <span className="text-red-400">{Math.abs(selectedPrediction.days_remaining)}d vencida</span>
                                                            : `${selectedPrediction.days_remaining}d restantes`)
                                                        : 'Sin datos'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 p-5">
                                        <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-primary)]" style={{ marginBottom: '16px' }}>
                                            <AlertCircle className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                                            Resumen
                                        </h4>
                                        <div className="space-y-2.5">
                                            <div className="flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3.5 py-2.5 border border-[var(--color-border)]/50">
                                                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Total eventos</span>
                                                <span className="text-sm font-bold text-[var(--color-text-primary)]">{events.length}</span>
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3.5 py-2.5 border border-[var(--color-border)]/50">
                                                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Último evento</span>
                                                <span className="text-xs font-bold text-[var(--color-text-primary)]">{events.length > 0 ? formatShortDate(events[0].performed_at) : '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: History */}
                                <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40">
                                    <div className="flex items-center justify-between border-b border-[var(--color-border)]/50 bg-[var(--color-bg-primary)]/20 px-4 py-3.5">
                                        <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-primary)]">
                                            <ShieldAlert className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                                            Historial completo
                                        </h4>
                                        <span className="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
                                            {events.length} {events.length === 1 ? 'registro' : 'registros'}
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                        {events.length === 0 ? (
                                            <div className="flex min-h-[250px] flex-col items-center justify-center gap-2.5 text-center opacity-60">
                                                <Calendar className="h-10 w-10 text-[var(--color-text-muted)] opacity-50" />
                                                <p className="text-xs font-medium text-[var(--color-text-muted)]">Esta cerradura aún no tiene eventos registrados.</p>
                                            </div>
                                        ) : (
                                            <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--color-border)] before:to-transparent">
                                                {events.map((event, index) => (
                                                    <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                        {/* Icon */}
                                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[var(--color-bg-secondary)] bg-[var(--color-bg-primary)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                                                            {event.type === 'battery' ? <Battery className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-amber-400" />}
                                                        </div>
                                                        
                                                        {/* Content Card */}
                                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm transition-all hover:shadow-md hover:border-[var(--color-border-hover)]">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${event.type === 'battery' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                                    {event.type === 'battery' ? 'Batería' : 'Mecánico'}
                                                                </span>
                                                                <time className="text-[11px] font-bold text-[var(--color-text-muted)] flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3"/>
                                                                    {formatShortDate(event.performed_at)}
                                                                </time>
                                                            </div>
                                                            
                                                            {event.part_name && (
                                                                <div className="mb-2 inline-flex items-center rounded-lg bg-[var(--color-bg-primary)]/50 px-2.5 py-1 text-xs">
                                                                    <span className="font-medium text-[var(--color-text-muted)] mr-1">Pieza:</span>
                                                                    <span className="font-semibold text-[var(--color-text-primary)]">{event.part_name}</span>
                                                                </div>
                                                            )}
                                                            
                                                            {event.description && (
                                                                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{event.description}</p>
                                                            )}
                                                            
                                                            {event.user_name && (
                                                                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] pt-3 border-t border-[var(--color-border)]/50">
                                                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                                                        <User className="w-3 h-3" />
                                                                    </div>
                                                                    {event.user_name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

