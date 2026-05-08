import React, { useState } from 'react';
import { TriangleAlert, Plus, DoorOpen, MapPin, BatteryFull, Lock, CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';
import { Card, CardHeader } from '@/components/ui/card';
import { LOCK_STATUS_LABELS } from '../utils/lockConstants';

const STATUS_FILTERS = [
    { value: 'all', label: 'Todas', icon: Lock, key: 'total', tone: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm' },
    { value: 'operational', label: 'Operativas', icon: CheckCircle2, key: 'healthy', tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-sm' },
    { value: 'preventive', label: 'Preventivas', icon: ShieldAlert, key: 'preventive', tone: 'border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-sm' },
    { value: 'failure', label: 'Fallas', icon: TriangleAlert, key: 'failure', tone: 'border-red-500/30 bg-red-500/10 text-red-300 shadow-sm' },
    { value: 'out_of_service', label: 'Bloqueadas', icon: XCircle, key: 'out_of_service', tone: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300 shadow-sm' },
];

export default function LockRackHeader({
    priorityLocks,
    operationalSummary,
    statusFilter,
    setStatusFilter,
    failureCount,
    outOfServiceCount,
    onOpenCreateEvent,
    onOpenReport,
    onOpenLockDetail
}) {
    const [showAlertsDrawer, setShowAlertsDrawer] = useState(false);

    const getCount = (key) => {
        if (key === 'failure') return failureCount;
        if (key === 'out_of_service') return outOfServiceCount;
        return operationalSummary?.[key] ?? 0;
    };

    return (
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
            <CardHeader className="py-3 px-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* Izquierda: Stat-Filters clickeables */}
                    <div className="flex w-full sm:w-auto items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {STATUS_FILTERS.map((option) => {
                            const count = getCount(option.key);
                            const isActive = statusFilter === option.value;
                            const Icon = option.icon;

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setStatusFilter(option.value)}
                                    className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                                        isActive
                                            ? `${option.tone} border-current`
                                            : 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]'
                                    }`}
                                >
                                    <Icon className="h-3 w-3 shrink-0" />
                                    <span className="hidden sm:inline">{option.label}</span>
                                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${isActive ? 'bg-white/10 text-current' : 'bg-[var(--color-bg-primary)]/80 text-[var(--color-text-muted)]'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Derecha: Botones de acción */}
                    <div className="flex w-full sm:w-auto items-center justify-center sm:justify-end gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={onOpenReport}
                            className="flex-1 sm:flex-none inline-flex h-7 sm:h-8 items-center justify-center gap-1 rounded-full bg-amber-500 px-3 sm:px-4 !text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600"
                        >
                            <TriangleAlert className="w-4 h-4" />
                            Reporte
                        </button>

                        <Button variant="register" icon={Plus} onClick={onOpenCreateEvent} className="flex-1 sm:flex-none h-7 sm:h-8 px-3 sm:px-4 !text-xs font-semibold whitespace-nowrap">
                            Registrar evento
                        </Button>

                        {/* Botón de Alertas y Menú Desplegable */}
                        <div
                            className="relative shrink-0 flex-1 sm:flex-none"
                            onMouseEnter={() => setShowAlertsDrawer(true)}
                            onMouseLeave={() => setShowAlertsDrawer(false)}
                        >
                            <Button
                                variant="danger"
                                icon={TriangleAlert}
                                onClick={() => setShowAlertsDrawer(!showAlertsDrawer)}
                                className="flex-1 sm:flex-none h-7 sm:h-8 !rounded-full px-3 sm:px-4 py-1 sm:py-2 !text-xs font-semibold shadow-sm whitespace-nowrap"
                            >
                                Alertas
                            </Button>
                            {priorityLocks.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-[var(--color-bg-primary)]">
                                    {priorityLocks.length}
                                </span>
                            )}

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
            </CardHeader>
        </Card>
    );
}