import React from 'react';
import { 
    Wrench, 
    CheckCircle2, 
    Clock, 
    Calendar,
    ChevronRight,
    CircleDollarSign,
    ClipboardSignature
} from 'lucide-react';
import Card from '@shared/common/Card';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';

export default function MaintenanceTab() {
    // Datos simulados (Mock Data)
    const metrics = {
        openOrders: 2,
        completedMonth: 8,
        totalCostMonth: 1250.00
    };

    const maintenanceOrders = [
        {
            id: 'M-103',
            vehicleId: 'V-004',
            plate: 'RK-775-PL',
            type: 'Correctivo',
            description: 'Reemplazo de alternador y batería',
            date: '16 Mar 2026',
            workshop: 'ElectroAuto CA',
            cost: 210.00,
            status: 'En Proceso'
        },
        {
            id: 'M-102',
            vehicleId: 'V-002',
            plate: 'XT-114-ZW',
            type: 'Preventivo',
            description: 'Cambio de aceite, filtros y revisión de fluidos',
            date: '15 Mar 2026',
            workshop: 'Taller Los Andes',
            cost: 80.00,
            status: 'Completado'
        },
        {
            id: 'M-101',
            vehicleId: 'V-005',
            plate: 'DF-441-NN',
            type: 'Preventivo',
            description: 'Revisión y cambio de balatas (frenos)',
            date: '12 Mar 2026',
            workshop: 'Frenos Rápidos',
            cost: 65.00,
            status: 'Completado'
        },
        {
            id: 'M-100',
            vehicleId: 'V-001',
            plate: 'PA-902-KL',
            type: 'Correctivo',
            description: 'Reparación de sistema de aire acondicionado',
            date: '08 Mar 2026',
            workshop: 'RefriAutos Express',
            cost: 320.00,
            status: 'Completado'
        }
    ];

    const getStatusConfig = (status) => {
        if (status === 'Completado') {
            return {
                iconBg: 'bg-emerald-500/10',
                iconColor: 'text-emerald-500',
                Icon: CheckCircle2,
                variant: 'success'
            };
        }
        return {
            iconBg: 'bg-amber-500/10',
            iconColor: 'text-amber-500',
            Icon: Clock,
            variant: 'warning'
        };
    };

    const getTypeVariant = (type) => {
        if (type === 'Preventivo') return 'info';
        return 'danger';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Cabecera / Acciones */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Control de Mantenimiento</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Gestión de taller y auditoría de costos</p>
                </div>
                <Button className="!rounded-full shadow-sm" variant="primary" icon={Wrench}>
                    Nueva Orden
                </Button>
            </div>

            {/* Fila Superior: Resumen de Indicadores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tarjeta 1 */}
                <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-4 border-l-4 border-l-amber-500 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Órdenes Abiertas</p>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)]">{metrics.openOrders}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                        <Wrench className="w-5 h-5 text-amber-500" />
                    </div>
                </div>

                {/* Tarjeta 2 */}
                <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-4 border-l-4 border-l-teal-500 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Completados (Mes)</p>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)]">{metrics.completedMonth}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-teal-500" />
                    </div>
                </div>

                {/* Tarjeta 3 */}
                <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-4 border-l-4 border-l-rose-500 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-[var(--color-text-muted)] mb-1">Costo Total (Mes)</p>
                        <p className="text-2xl font-bold text-[var(--color-text-primary)]">${metrics.totalCostMonth.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                        <CircleDollarSign className="w-5 h-5 text-rose-500" />
                    </div>
                </div>
            </div>

            {/* Bloque Inferior: Lista de Órdenes */}
            <Card padding="none" className="overflow-hidden">
                <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/30 flex items-center gap-2">
                    <ClipboardSignature className="w-5 h-5 text-[var(--color-text-muted)]" />
                    <h4 className="font-medium text-[var(--color-text-primary)]">Registro Histórico y Activo</h4>
                </div>
                
                <div className="divide-y divide-[var(--color-border)] flex flex-col">
                    {maintenanceOrders.map((order) => {
                        const sConfig = getStatusConfig(order.status);
                        const StatusIcon = sConfig.Icon;

                        return (
                            <div key={order.id} className="group p-4 hover:bg-[var(--color-bg-tertiary)]/50 transition-colors flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 relative">
                                
                                {/* Ícono de Estado (Izquierda) */}
<div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${sConfig.iconBg}`}>
                                        <Wrench className={`w-6 h-6 ${sConfig.iconColor}`} />
                                </div>

                                {/* Información Central */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="font-semibold text-[var(--color-text-primary)]">{order.id}</span>
                                        <span className="text-[var(--color-text-muted)] text-sm">•</span>
                                        <span className="font-medium text-[var(--color-text-primary)]">{order.vehicleId} <span className="font-mono text-xs opacity-70">({order.plate})</span></span>
<Badge variant={getTypeVariant(order.type)}>{order.type}</Badge>
                                    </div>
                                    <p className="text-sm text-[var(--color-text-secondary)]">
                                        {order.description}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
                                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {order.date}</span>
                                        <span className="flex items-center gap-1"><Wrench className="w-3.5 h-3.5" /> {order.workshop}</span>
                                    </div>
                                </div>

                                {/* Información Financiera y Cierre (Derecha) */}
                                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 sm:w-48">
                                    <div className="text-right">
                                        <p className="text-sm text-[var(--color-text-muted)] mb-0.5">Costo Estimado</p>
                                        <p className="text-xl font-semibold text-[var(--color-text-primary)] font-mono">
                                            ${order.cost.toFixed(2)}
                                        </p>
                                    </div>
<Badge variant={sConfig.variant} className="text-sm flex items-center gap-1.5">
                                            <StatusIcon className="w-4 h-4" />
                                            {order.status}
                                        </Badge>
                                </div>

                                {/* Botón Hover Overlay p/Desktop */}
                                <div className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-[var(--color-bg-tertiary)] to-transparent pl-8 py-2">
                                    <Button className="!rounded-full px-4 shadow-md bg-[var(--color-bg-primary)] hover:bg-[var(--color-primary)] hover:text-white border-[var(--color-border)]" variant="outline" size="sm">
                                        Ver Detalles <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                                {/* Botón p/Mobile (siempre visible) */}
                                <div className="sm:hidden mt-2 border-t border-[var(--color-border)] pt-3">
                                    <Button className="w-full !rounded-full" variant="outline" size="sm">
                                        Ver Detalles
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}