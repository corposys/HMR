import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, Loader2, Search, Battery, AlertCircle, ShieldAlert, Calendar, User, Plus, RefreshCw, TriangleAlert, ChevronDown, ChevronRight, X, Activity, BatteryFull, MapPin, CheckCircle2 } from 'lucide-react';
import { useLocksOverview } from '@features/maintenance/locks/hooks/useLocks';
import CreateLockEventModal from '@features/maintenance/locks/components/CreateLockEventModal';

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

const LOCK_STATUS_DOT_STYLES = {
    operational: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]',
    preventive: 'bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.45)]',
    failure: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.45)]',
    out_of_service: 'bg-zinc-400 shadow-[0_0_10px_rgba(161,161,170,0.35)]',
};

const LOCK_CARD_MIN_WIDTH_DENSE = 160;
const RACK_VIEW_MODES = {
    structure: 'structure',
    module: 'module',
    priority: 'priority',
};

const RACK_VIEW_LABELS = {
    structure: 'Estructura hotelera',
    module: 'Apilado por módulo',
    priority: 'Prioridad operativa',
};

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

const getRackPriorityScore = (item) => {
    const statusRank = {
        failure: 0,
        out_of_service: 1,
        preventive: 2,
        operational: 3,
    };

    const prediction = item.prediction;
    const base = statusRank[item.status] ?? 3;
    const predictionRank = prediction
        ? (prediction.days_remaining <= 0 ? -2 : prediction.days_remaining <= 15 ? -1 : 0)
        : 0;

    return base * 100 + predictionRank;
};

const formatFloorCode = (floorCode) => {
    if (!floorCode) return 'Sin piso';
    return String(floorCode).toUpperCase();
};

const LockSummaryCard = ({ item, prediction, onOpen, showFloorBadge = true }) => {
    const statusKey = item.status || 'operational';
    const statusDotClass = LOCK_STATUS_DOT_STYLES[statusKey] || LOCK_STATUS_DOT_STYLES.operational;
    const healthScore = prediction?.health_score ?? null;
    const floorLabel = formatFloorCode(item.floor_code);
    const batteryBarColor = healthScore === null ? 'bg-zinc-600'
        : healthScore > 60 ? 'bg-emerald-500'
            : healthScore > 30 ? 'bg-amber-400'
                : 'bg-red-500';
    const daysColor = !prediction ? 'text-[var(--color-text-muted)]'
        : prediction.days_remaining <= 0 ? 'text-red-400'
            : prediction.days_remaining <= 15 ? 'text-amber-400'
                : 'text-emerald-400';

    return (
        <button
            type="button"
            onClick={() => onOpen(item.room_id || item.id)}
            className="group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 p-2.5 text-left transition-all hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg-primary)]/60 hover:shadow-md"
        >
            <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex flex-col items-start">
                    <div className="flex items-center gap-2">
                        {showFloorBadge && (
                            <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                                {floorLabel}
                            </span>
                        )}
                        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Hab.</p>
                    </div>

                    <div className="mt-1">
                        <p className="text-base font-bold leading-tight text-[var(--color-text-primary)] text-center">{item.room_number}</p>
                    </div>
                </div>

                <span
                    className={`mt-0.5 inline-flex h-2.5 w-2.5 rounded-full ${statusDotClass}`}
                    aria-label={LOCK_STATUS_LABELS[statusKey] || LOCK_STATUS_LABELS.operational}
                    title={LOCK_STATUS_LABELS[statusKey] || LOCK_STATUS_LABELS.operational}
                />
            </div>

            <div className="mb-2">
                <div className="mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                        <Battery className="h-3 w-3" />
                        Batería
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">
                        {healthScore !== null ? `${healthScore}%` : '—'}
                    </span>
                </div>
                <div className="h-1 w-full rounded-full bg-[var(--color-border)]">
                    <div
                        className={`h-1 rounded-full transition-all ${batteryBarColor}`}
                        style={{ width: `${healthScore ?? 0}%` }}
                    />
                </div>
            </div>

            <div className={`mb-2 flex items-center gap-1 text-[10px] font-semibold ${daysColor}`}>
                <ShieldAlert className="h-3 w-3" />
                {prediction
                    ? (prediction.days_remaining <= 0
                        ? `Vencida ${Math.abs(prediction.days_remaining)}d`
                        : `${prediction.days_remaining}d restantes`)
                    : 'Sin predicción'}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--color-border)]/40 pt-2 text-[10px] text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.last_maintenance_at ? formatShortDate(item.last_maintenance_at) : 'Sin mant.'}
                </span>
                <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {item.events_count || 0} ev.
                </span>
            </div>

            <div className="absolute right-2.5 top-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                <ChevronRight className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            </div>
        </button>
    );
};

export default function LocksRackPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedLockId, setSelectedLockId] = useState(null);
    const [selectedLock, setSelectedLock] = useState(null);
    const [events, setEvents] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);
    const [rackViewMode] = useState(RACK_VIEW_MODES.priority);
    const [savingEvent, setSavingEvent] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const { locks, predictionsByRoom, loading, error, fetchLocksOverview } = useLocksOverview();

    useEffect(() => {
        fetchLocksOverview();
    }, [fetchLocksOverview]);

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
            if (selectedLockId) {
                await fetchLockDetail(selectedLockId);
            }
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

    const groupedLocks = useMemo(() => {
        return [...filteredLocks]
            .map((item) => ({
                ...item,
                prediction: predictionsByRoom[item.room_id] || null,
            }))
            .sort((a, b) => {
                const priorityA = getRackPriorityScore(a);
                const priorityB = getRackPriorityScore(b);
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }

                const moduleA = Number(a.module_number) || Number(a.module_id) || 0;
                const moduleB = Number(b.module_number) || Number(b.module_id) || 0;
                if (moduleA !== moduleB) {
                    return moduleA - moduleB;
                }

                const floorA = String(a.floor_code || '').toUpperCase();
                const floorB = String(b.floor_code || '').toUpperCase();
                if (floorA !== floorB) {
                    if (floorA === 'PB') return -1;
                    if (floorB === 'PB') return 1;
                    return floorA.localeCompare(floorB, undefined, { numeric: true });
                }

                return String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true });
            });
    }, [filteredLocks, predictionsByRoom]);

    const groupedPriorityByModule = useMemo(() => {
        // Build modules preserving priority order inside each module and ordering modules by their most urgent room
        const modules = {};
        filteredLocks.forEach((item) => {
            const key = String(item.module_id || 'nomodule');
            if (!modules[key]) modules[key] = { moduleId: item.module_id, moduleName: item.module_name, moduleNumber: item.module_number, rooms: [] };
            modules[key].rooms.push({ ...item, prediction: predictionsByRoom[item.room_id] || null });
        });

        const moduleArray = Object.values(modules).map((m) => {
            const rooms = m.rooms.sort((a, b) => getRackPriorityScore(a) - getRackPriorityScore(b));
            const urgency = rooms.reduce((acc, r) => Math.min(acc, getUrgencyScore(r, r.prediction)), Infinity);
            return { ...m, rooms, urgency };
        });

        moduleArray.sort((a, b) => (a.urgency - b.urgency) || ((a.moduleId || 0) - (b.moduleId || 0)));

        return moduleArray;
    }, [filteredLocks, predictionsByRoom]);

    const groupedByModule = useMemo(() => {
        const modules = {};
        filteredLocks.forEach((item) => {
            const key = String(item.module_id);
            if (!modules[key]) {
                modules[key] = {
                    moduleId: item.module_id,
                    moduleName: item.module_name,
                    moduleNumber: item.module_number,
                    rooms: [],
                };
            }
            modules[key].rooms.push({
                ...item,
                prediction: predictionsByRoom[item.room_id] || null,
            });
        });

        return Object.values(modules)
            .sort((a, b) => a.moduleId - b.moduleId)
            .map((module) => ({
                ...module,
                rooms: module.rooms.sort((a, b) => String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true })),
            }));
    }, [filteredLocks, predictionsByRoom]);

    const groupedByStructure = useMemo(() => {
        const modules = {};
        filteredLocks.forEach((item) => {
            const moduleKey = String(item.module_id);
            if (!modules[moduleKey]) {
                modules[moduleKey] = {
                    moduleId: item.module_id,
                    moduleName: item.module_name,
                    moduleNumber: item.module_number,
                    floors: {},
                };
            }

            const floorKey = String(item.floor_code || '');
            if (!modules[moduleKey].floors[floorKey]) {
                modules[moduleKey].floors[floorKey] = {
                    floorCode: item.floor_code,
                    rooms: [],
                };
            }

            modules[moduleKey].floors[floorKey].rooms.push({
                ...item,
                prediction: predictionsByRoom[item.room_id] || null,
            });
        });

        return Object.values(modules)
            .sort((a, b) => a.moduleId - b.moduleId)
            .map((module) => ({
                ...module,
                floors: Object.values(module.floors)
                    .sort((a, b) => {
                        const codeA = String(a.floorCode || '').toUpperCase();
                        const codeB = String(b.floorCode || '').toUpperCase();
                        if (codeA === 'PB') return -1;
                        if (codeB === 'PB') return 1;
                        return codeA.localeCompare(codeB, undefined, { numeric: true });
                    })
                    .map((floor) => ({
                        ...floor,
                        rooms: floor.rooms.sort((a, b) => String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true })),
                    })),
            }));
    }, [filteredLocks, predictionsByRoom]);

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

    const openLockDetail = (roomId) => {
        if (!roomId) {
            return;
        }
        navigate(`/maintenance/room/${roomId}`);
    };

    if (loading) {
        return (
            <div className="py-6 px-4 lg:px-8 w-full flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="py-4 w-full px-4 lg:px-8">
            <div className="mx-auto max-w-auto space-y-4">

                {/* ── Fila Principal: Título + Filtros (Izquierda) | Stats + Buscador + Alertas (Derecha) ── */}
                <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">

                    {/* IZQUIERDA: Título + botones unificados */}
                    <div className="flex flex-wrap items-center gap-2 xl:gap-3">

                        <div className="flex flex-wrap items-center gap-1.5">
                            {[
                                {
                                    value: 'all',
                                    label: 'Todas',
                                    icon: Activity,
                                    count: operationalSummary.total,
                                    tone: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
                                },
                                {
                                    value: 'operational',
                                    label: 'Operativas',
                                    icon: CheckCircle2,
                                    count: operationalSummary.healthy,
                                    tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
                                },
                                {
                                    value: 'preventive',
                                    label: 'Preventivas',
                                    icon: ShieldAlert,
                                    count: operationalSummary.preventive,
                                    tone: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
                                },
                                {
                                    value: 'failure',
                                    label: 'Falla',
                                    icon: TriangleAlert,
                                    count: filteredLocks.filter((item) => item.status === 'failure').length,
                                    tone: 'border-red-500/30 bg-red-500/10 text-red-300',
                                },
                                {
                                    value: 'out_of_service',
                                    label: 'Fuera de servicio',
                                    icon: X,
                                    count: filteredLocks.filter((item) => item.status === 'out_of_service').length,
                                    tone: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
                                },
                            ].map((option) => {
                                const isActive = statusFilter === option.value;
                                const Icon = option.icon;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setStatusFilter(option.value)}
                                        className={`relative flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${isActive
                                            ? `${option.tone} shadow-sm`
                                            : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]'
                                            }`}
                                    >
                                        <Icon className="h-3.5 w-3.5 shrink-0" />
                                        <span>{option.label}</span>
                                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${isActive ? 'bg-white/10 text-current' : 'bg-[var(--color-bg-primary)]/80 text-[var(--color-text-muted)]'}`}>
                                            {option.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="relative w-full sm:w-48 xl:w-56 shrink-0">
                            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Buscar habitación…"
                                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-1.5 pl-8 pr-3 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* DERECHA: Alertas */}
                    <div className="flex flex-wrap items-center gap-2 xl:gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedLockId(null);
                                setSelectedLock(null);
                                setShowCreate(true);
                            }}
                            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Registrar evento
                        </button>

                        {/* Botón de Alertas y Menú Desplegable (Popover) */}
                        <div 
                            className="relative"
                            onMouseEnter={() => setShowAlertsDrawer(true)}
                            onMouseLeave={() => setShowAlertsDrawer(false)}
                        >
                            <button
                                type="button"
                                onClick={() => setShowAlertsDrawer(!showAlertsDrawer)}
                                className="relative flex h-8 items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                            >
                                <TriangleAlert className="h-3.5 w-3.5" />
                                Alertas
                                {priorityLocks.length > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-[var(--color-bg-primary)]">
                                        {priorityLocks.length}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown Panel */}
                            {showAlertsDrawer && (
                                <div className="absolute right-0 top-full mt-1.5 w-64 max-h-[70vh] flex flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] shadow-2xl z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top-right">
                                    {/* Header Dropdown */}
                                    <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2">
                                        <div className="flex items-center gap-1.5">
                                            <TriangleAlert className="h-3 w-3 text-red-400" />
                                            <div className="text-xs font-semibold text-[var(--color-text-primary)]">Prioridades de hoy</div>
                                        </div>
                                    </div>
                                    
                                    {/* Body Dropdown */}
                                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-1.5">
                                        {priorityLocks.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-4 text-center opacity-60 gap-1.5">
                                                <DoorOpen className="h-4 w-4 text-emerald-500" />
                                                <p className="text-[10px] font-medium text-[var(--color-text-muted)]">No hay prioridades para hoy.<br />Todo en orden.</p>
                                            </div>
                                        ) : (
                                            priorityLocks.map((item) => {
                                                const prediction = item.prediction;
                                                const isCritical = item.status === 'failure' || (prediction && prediction.days_remaining <= 0);
            
                                                return (
                                                    <button
                                                        key={item.id}
                                                        onClick={() => {
                                                            setShowAlertsDrawer(false);
                                                            openLockDetail(item.room_id || item.id);
                                                        }}
                                                        className={`w-full text-left rounded-md border p-2 transition-all hover:shadow hover:-translate-y-px ${isCritical
                                                            ? 'bg-red-500/5 border-red-500/20 hover:border-red-400/40'
                                                            : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-400/40'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1.5">
                                                            <div className="font-semibold text-[var(--color-text-primary)] text-[11px]">Hab. {item.room_number}</div>
                                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                                                                }`}>
                                                                {item.status === 'operational' ? 'Mantenimiento' : LOCK_STATUS_LABELS[item.status]}
                                                            </span>
                                                        </div>
            
                                                        <div className="flex flex-col gap-0.5 mt-1">
                                                            <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
                                                                <MapPin className="h-2.5 w-2.5 text-[var(--color-text-muted)] shrink-0" />
                                                                <span className="truncate">{item.module_name} - {item.floor_code}</span>
                                                            </div>
            
                                                            {prediction && (
                                                                <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-secondary)]">
                                                                    <BatteryFull className="h-2.5 w-2.5 text-[var(--color-text-muted)] shrink-0" />
                                                                    <span>Bat: <span className="font-semibold">{prediction.health_score}%</span></span>
                                                                    <span className="opacity-40">|</span>
                                                                    <span className={prediction.days_remaining <= 0 ? 'text-red-400 font-semibold' : ''}>
                                                                        {prediction.days_remaining <= 0 ? 'Vencida' : `${prediction.days_remaining}d`}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                        {error}
                    </div>
                )}

                {/* ── Rack ── */}
                <div className="space-y-2">
                    {groupedLocks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-10 text-center">
                            <p className="text-sm text-[var(--color-text-muted)]">No hay cerraduras para mostrar con los filtros actuales.</p>
                        </div>
                    ) : (
                        rackViewMode === RACK_VIEW_MODES.structure ? (
                            <div className="space-y-3">
                                {groupedByStructure.map((module) => (
                                    <section key={module.moduleId} className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90">
                                        <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/45 px-3 py-2">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                                                <DoorOpen className="h-3 w-3 text-[var(--color-primary)]" />
                                                <span>{module.moduleName || `Módulo ${module.moduleNumber || module.moduleId}`}</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">{module.floors.length} pisos</span>
                                        </div>

                                        <div className="space-y-2 p-2">
                                            {module.floors.map((floor) => (
                                                <article key={`${module.moduleId}-${floor.floorCode}`} className="overflow-hidden rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-primary)]/35">
                                                    <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 px-2.5 py-1.5">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-primary)]">
                                                            <span className="font-semibold">{formatFloorCode(floor.floorCode)}</span>
                                                            <span className="text-[var(--color-text-muted)] text-[10px]">·</span>
                                                            <span className="text-[var(--color-text-secondary)] text-[10px]">{module.moduleName}</span>
                                                        </div>
                                                        <span className="text-[10px] text-[var(--color-text-muted)]">{floor.rooms.length} hab.</span>
                                                    </div>
                                                    <div className="grid gap-1.5 p-1.5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                                                        {floor.rooms.map((item) => (
                                                            <LockSummaryCard key={item.id} item={item} prediction={item.prediction} onOpen={openLockDetail} />
                                                        ))}
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        ) : rackViewMode === RACK_VIEW_MODES.module ? (
                            <div className="space-y-3">
                                {groupedByModule.map((module) => (
                                    <section key={module.moduleId} className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90">
                                        <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/45 px-3 py-2">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                                                <DoorOpen className="h-3 w-3 text-[var(--color-primary)]" />
                                                <span>{module.moduleName || `Módulo ${module.moduleNumber || module.moduleId}`}</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">{module.rooms.length} hab.</span>
                                        </div>
                                        <div className="grid gap-2 p-2 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                                            {module.rooms.map((item) => (
                                                <LockSummaryCard key={item.id} item={item} prediction={item.prediction} onOpen={openLockDetail} />
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90">
                                <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/45 px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                                                    <DoorOpen className="h-3 w-3 text-[var(--color-primary)]" />
                                                    <span>Rack de prioridad</span>
                                                </div>

                                                {/* Inline filtros: Vista + Hab/fila */}
                                                {/* controls moved to the right side */}

                                            </div>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">{groupedPriorityByModule.reduce((total, module) => total + module.rooms.length, 0)} hab.</span>
                                </div>

                                        <div className="space-y-3 p-2">
                                            {groupedPriorityByModule.map((module) => (
                                                <section key={module.moduleId || module.moduleName} className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90">
                                                    <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/45 px-3 py-2">
                                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                                                            <DoorOpen className="h-3 w-3 text-[var(--color-primary)]" />
                                                            <span>{module.moduleName || `Módulo ${module.moduleNumber || module.moduleId}`}</span>
                                                        </div>
                                                        <span className="text-[10px] text-[var(--color-text-muted)]">{module.rooms.length} hab.</span>
                                                    </div>

                                                    <div className="grid gap-2 p-2 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                                                        {module.rooms.map((item) => (
                                                            <LockSummaryCard key={item.id} item={item} prediction={item.prediction} onOpen={openLockDetail} />
                                                        ))}
                                                    </div>
                                                </section>
                                            ))}
                                        </div>
                            </div>
                        )
                    )}
                </div>
            </div>

            {showCreate && (
                <CreateLockEventModal
                    onSave={handleCreateEvent}
                    onCancel={() => setShowCreate(false)}
                    saving={savingEvent}
                    initialRoomId={selectedLock?.room_id ?? null}
                    lockRoomSelection={Boolean(selectedLock)}
                />
            )}

            {showTimelineModal && selectedLock && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowTimelineModal(false)} />
                    <div className="relative z-10 w-full max-w-5xl flex max-h-[88vh] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-2xl">

                        {/* Header */}
                        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/30 px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                    <DoorOpen className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="flex items-center gap-2 text-[13px] font-bold tracking-tight text-[var(--color-text-primary)] sm:text-sm">
                                        Hab. {selectedLock.room_number}
                                        <span className="text-xs font-normal opacity-40 text-[var(--color-text-muted)]">|</span>
                                        <span className="text-[9px] font-medium text-[var(--color-text-muted)] sm:text-[10px]">{selectedLock.module_name} – {selectedLock.floor_code}</span>
                                        <span className={`rounded-full border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide sm:text-[8px] ${LOCK_STATUS_STYLES[selectedLock.status] || LOCK_STATUS_STYLES.operational}`}>
                                            {LOCK_STATUS_LABELS[selectedLock.status] || 'Operativa'}
                                        </span>
                                    </h3>
                                    <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] opacity-75">{selectedLock.code}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowTimelineModal(false); setShowCreate(true); }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-1.5 text-[10px] font-semibold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]/20 hover:border-[var(--color-primary)]/50"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Registrar evento
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fetchLockDetail(selectedLockId)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]/50 text-[var(--color-text-muted)] transition-all hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
                                    title="Recargar"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowTimelineModal(false)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]/50 text-[var(--color-text-muted)] transition-all hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)]"
                                    aria-label="Cerrar detalle"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        {detailLoading ? (
                            <div className="flex flex-1 items-center justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar sm:p-5">
                                <div className="grid gap-4 lg:grid-cols-[1.55fr_0.95fr]">

                                    {/* Historial completo */}
                                    <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40">
                                        <div className="flex items-center justify-between border-b border-[var(--color-border)]/50 bg-[var(--color-bg-primary)]/20 px-4 py-3">
                                            <h4 className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-primary)] sm:text-[10px]">
                                                <ShieldAlert className="h-3 w-3 text-[var(--color-primary)]" />
                                                Historial completo
                                            </h4>
                                            <span className="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-[8px] font-bold text-[var(--color-primary)] sm:text-[9px]">
                                                {events.length} {events.length === 1 ? 'registro' : 'registros'}
                                            </span>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar">
                                            {events.length === 0 ? (
                                                <div className="flex min-h-[310px] flex-col items-center justify-center gap-2 text-center opacity-60">
                                                    <Calendar className="h-10 w-10 text-[var(--color-text-muted)] opacity-50" />
                                                    <p className="text-[10px] font-medium text-[var(--color-text-muted)] sm:text-[11px]">Esta cerradura aún no tiene eventos registrados.</p>
                                                </div>
                                            ) : (
                                                <div className="relative space-y-3 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--color-border)] before:to-transparent">
                                                    {events.map((event) => (
                                                        <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-[var(--color-bg-secondary)] bg-[var(--color-bg-primary)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                                                                {event.type === 'battery' ? <Battery className="h-4 w-4 text-emerald-400" /> : <ShieldAlert className="h-4 w-4 text-amber-400" />}
                                                            </div>
                                                            <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm transition-all hover:shadow-md hover:border-[var(--color-border-hover)]">
                                                                <div className="mb-2 flex items-center justify-between">
                                                                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${event.type === 'battery' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                                        {event.type === 'battery' ? 'Batería' : 'Mecánico'}
                                                                    </span>
                                                                    <time className="flex items-center gap-1 text-[9px] font-bold text-[var(--color-text-muted)]">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {formatShortDate(event.performed_at)}
                                                                    </time>
                                                                </div>
                                                                {event.part_name && (
                                                                    <div className="mb-2 inline-flex items-center rounded-lg bg-[var(--color-bg-primary)]/50 px-2 py-1 text-[10px]">
                                                                        <span className="font-medium text-[var(--color-text-muted)] mr-1">Pieza:</span>
                                                                        <span className="font-semibold text-[var(--color-text-primary)]">{event.part_name}</span>
                                                                    </div>
                                                                )}
                                                                {event.description && (
                                                                    <p className="text-[10px] leading-relaxed text-[var(--color-text-secondary)] sm:text-[11px]">{event.description}</p>
                                                                )}
                                                                {event.user_name && (
                                                                    <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--color-border)]/50 pt-2.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                                                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                                                            <User className="h-3 w-3" />
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

                                    {/* Columna derecha — Predicción + Estado + resumen */}
                                    <div className="space-y-3.5">
                                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 p-3.5">
                                            <h4 className="mb-2.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-primary)] sm:text-[10px]">
                                                <BatteryFull className="h-3 w-3 text-[var(--color-primary)]" />
                                                Predicción de batería
                                            </h4>
                                            <div className="space-y-2.5">
                                                <div className="rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/35 p-3">
                                                    <div className="mb-1.5 flex items-center justify-between text-[8px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] sm:text-[9px]">
                                                        <span className="flex items-center gap-1"><BatteryFull className="h-3 w-3" />Salud</span>
                                                        <span className="text-[var(--color-text-primary)]">{selectedPrediction ? `${selectedPrediction.health_score}%` : 'N/A'}</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-[var(--color-border)]">
                                                        <div
                                                            className={`h-2 rounded-full transition-all ${!selectedPrediction ? 'bg-zinc-600' : selectedPrediction.health_score > 60 ? 'bg-emerald-500' : selectedPrediction.health_score > 30 ? 'bg-amber-400' : 'bg-red-500'}`}
                                                            style={{ width: `${selectedPrediction?.health_score ?? 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/35 p-3">
                                                    <div className="mb-1 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] sm:text-[9px]">
                                                        <Calendar className="h-3 w-3" />Próximo cambio
                                                    </div>
                                                    <div className="text-[13px] font-bold text-[var(--color-text-primary)] sm:text-sm">
                                                        {selectedPrediction
                                                            ? (selectedPrediction.days_remaining <= 0
                                                                ? <span className="text-red-400">{Math.abs(selectedPrediction.days_remaining)}d vencida</span>
                                                                : `${selectedPrediction.days_remaining}d restantes`)
                                                            : 'Sin datos'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 p-3.5">
                                            <div className="mb-2.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-primary)] sm:text-[10px]">
                                                <AlertCircle className="h-3 w-3 text-[var(--color-primary)]" />
                                                Estado actual
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
                                                            className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-wide transition-all sm:text-[10px] ${active
                                                                ? `${LOCK_STATUS_STYLES[value]} ring-1 ring-inset ring-current/20 shadow-sm`
                                                                : 'border-[var(--color-border)] bg-[var(--color-bg-primary)]/30 text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-primary)]'
                                                                }`}
                                                        >
                                                            {label}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/35 p-3.5">
                                                <div className="mb-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-primary)] sm:text-[10px]">
                                                    <ShieldAlert className="h-3 w-3 text-[var(--color-primary)]" />
                                                    Resumen
                                                </div>
                                                <div className="grid gap-1.5 sm:grid-cols-2">
                                                    <div className="flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 border border-[var(--color-border)]/50 sm:col-span-2">
                                                        <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Total eventos</span>
                                                        <span className="text-sm font-bold text-[var(--color-text-primary)]">{events.length}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 border border-[var(--color-border)]/50">
                                                        <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Último evento</span>
                                                        <span className="text-[10px] font-bold text-[var(--color-text-primary)]">{events.length > 0 ? formatShortDate(events[0].performed_at) : '—'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 border border-[var(--color-border)]/50">
                                                        <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Últ. mant.</span>
                                                        <span className="text-[10px] font-bold text-[var(--color-text-primary)]">{formatShortDate(selectedLock.last_maintenance_at)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 border border-[var(--color-border)]/50 sm:col-span-2">
                                                        <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Últ. tipo</span>
                                                        <span className="text-[10px] font-bold text-[var(--color-text-primary)]">{selectedLock.last_maintenance_type || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


        </div>
    );
}
