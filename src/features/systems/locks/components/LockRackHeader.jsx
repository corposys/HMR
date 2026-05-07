import React, { useState } from 'react';
import { TriangleAlert, Search, Plus, DoorOpen, MapPin, BatteryFull, RefreshCw } from 'lucide-react';
import Badge from '@shared/common/Badge';
import { LOCK_STATUS_LABELS } from '../utils/lockConstants';

export default function LockRackHeader({
    search,
    setSearch,
    priorityLocks,
    onOpenCreateEvent,
    onOpenReport,
    onOpenLockDetail,
    onRefresh
}) {
    const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);

    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {/* IZQUIERDA: Buscador */}
            <div className="flex flex-wrap items-center gap-2 xl:gap-3">
                <div className="relative w-full sm:w-64 shrink-0">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar por habitación, piso o módulo..."
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-1.5 pl-8 pr-3 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                    />
                </div>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors shrink-0"
                        title="Actualizar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* DERECHA: Botones */}
            <div className="flex flex-wrap items-center gap-2 xl:gap-3">
                <button
                    type="button"
                    onClick={onOpenReport}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-500/20"
                >
                    <TriangleAlert className="h-3.5 w-3.5" />
                    Reportar Falla
                </button>

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
{isCritical ? (
                                                            <Badge variant="danger" className="text-[8px] font-bold uppercase tracking-wider">
                                                                {item.status === 'operational' ? 'Mantenimiento' : LOCK_STATUS_LABELS[item.status]}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="warning" className="text-[8px] font-bold uppercase tracking-wider">
                                                                {item.status === 'operational' ? 'Mantenimiento' : LOCK_STATUS_LABELS[item.status]}
                                                            </Badge>
                                                        )}
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
