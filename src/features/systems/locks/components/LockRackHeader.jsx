import React, { useState } from 'react';
import { TriangleAlert, Plus, DoorOpen, MapPin, BatteryFull, Lock, CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';
import CustomDropdown from '@shared/common/CustomDropdown';
import { Card, CardHeader } from '@/components/ui/card';
import { LOCK_STATUS_LABELS } from '../utils/lockConstants';

const STATUS_FILTERS = [
    { value: 'all', label: 'Todos' },
    { value: 'operational', label: 'Operativas' },
    { value: 'preventive', label: 'Preventivas' },
    { value: 'failure', label: 'Fallas' },
    { value: 'out_of_service', label: 'Bloqueadas' },
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

    const statsItems = [
        { label: 'total', value: operationalSummary?.total || 0, icon: Lock, color: 'text-cyan-400' },
        { label: 'operativas', value: operationalSummary?.healthy || 0, icon: CheckCircle2, color: 'text-emerald-400' },
        { label: 'prev.', value: operationalSummary?.preventive || 0, icon: ShieldAlert, color: 'text-amber-400' },
        { label: 'fallas', value: failureCount || 0, icon: TriangleAlert, color: 'text-red-400' },
        { label: 'bloqueadas', value: outOfServiceCount || 0, icon: XCircle, color: 'text-zinc-400' },
    ];

    return (
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
            <CardHeader className="py-3 px-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* Izquierda: Stats estilo Reservas */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex items-center gap-3 text-xs">
                            {statsItems.map((stat) => {
                                const Icon = stat.icon;
                                return (
                                    <div key={stat.label} className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                        <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                                        <span><strong className="text-[var(--color-text-primary)]">{stat.value}</strong> {stat.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Derecha: Filtro + Botones de acción */}
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <CustomDropdown
                            value={statusFilter}
                            onChange={(v) => setStatusFilter(v)}
                            options={STATUS_FILTERS}
                            placeholder="Estado"
                            className="min-w-[140px]"
                            buttonClassName="h-8"
                        />

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