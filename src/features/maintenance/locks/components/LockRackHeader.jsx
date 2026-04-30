import React, { useState } from 'react';
import { Activity, CheckCircle2, ShieldAlert, TriangleAlert, X, Search, Plus, DoorOpen, MapPin, BatteryFull } from 'lucide-react';
import { LOCK_STATUS_LABELS } from '../utils/lockConstants';

export default function LockRackHeader({
    statusFilter,
    setStatusFilter,
    search,
    setSearch,
    operationalSummary,
    priorityLocks,
    onOpenCreateEvent,
    onOpenLockDetail,
    failureCount,
    outOfServiceCount
}) {
    const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);

    return (
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
                            count: failureCount,
                            tone: 'border-red-500/30 bg-red-500/10 text-red-300',
                        },
                        {
                            value: 'out_of_service',
                            label: 'Fuera de servicio',
                            icon: X,
                            count: outOfServiceCount,
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
                    onClick={onOpenCreateEvent}
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
                            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2">
                                <div className="flex items-center gap-1.5">
                                    <TriangleAlert className="h-3 w-3 text-red-400" />
                                    <div className="text-xs font-semibold text-[var(--color-text-primary)]">Prioridades de hoy</div>
                                </div>
                            </div>

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
                                                    onOpenLockDetail(item.room_id || item.id);
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
    );
}
