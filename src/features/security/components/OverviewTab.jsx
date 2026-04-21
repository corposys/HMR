import React from 'react';
import { 
    Car, 
    Fuel,
    CircleDollarSign,
    AlertTriangle,
    AlertCircle,
    Info,
    Calendar,
    ChevronDown,
    Wrench
} from 'lucide-react';
import StatCard from '@shared/common/StatCard';
import Card, { CardHeader, CardTitle, CardContent } from '@shared/common/Card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

export default function OverviewTab() {
    const stats = [
        {
            title: 'Total Flota',
            value: '24',
            subtitle: '+1 este mes',
            icon: Car,
            trend: 4.3,
            trendLabel: 'vs. mes anterior',
            variant: 'default'
        },
        {
            title: 'Eficiencia Promedio',
            value: '8.5 km/L',
            subtitle: 'Estado: Óptimo',
            icon: Fuel,
            trend: 2.1,
            trendLabel: 'mejora',
            variant: 'success'
        },
        {
            title: 'Costo por Km (CPK)',
            value: '$0.08',
            subtitle: 'Tendencia a la baja',
            icon: CircleDollarSign,
            trend: -5.2,
            trendLabel: 'vs. mes anterior',
            variant: 'default'
        },
        {
            title: 'Gasto Acumulado',
            value: '$3,450',
            subtitle: 'Excede presupuesto mensual',
            icon: AlertTriangle,
            trend: 15,
            trendLabel: 'por encima del límite',
            variant: 'danger'
        },
    ];

    const chartData = [
        { day: 'Lun', consumido: 120, kms: 950 },
        { day: 'Mar', consumido: 135, kms: 1020 },
        { day: 'Mié', consumido: 110, kms: 890 },
        { day: 'Jue', consumido: 145, kms: 1100 },
        { day: 'Vie', consumido: 160, kms: 1250 },
        { day: 'Sáb', consumido: 180, kms: 1400 },
        { day: 'Dom', consumido: 90, kms: 700 },
    ];

    const alerts = [
        {
            id: 1,
            type: 'danger',
            message: 'Camioneta V-004 reporta 3.4 km/L - Posible merma de combustible.',
            time: 'Hace 2 horas',
            icon: AlertCircle
        },
        {
            id: 2,
            type: 'warning',
            message: 'Mantenimiento preventivo próximo para Autobús A-02 (faltan 500 km).',
            time: 'Hace 5 horas',
            icon: Wrench
        },
        {
            id: 3,
            type: 'info',
            message: 'Vencimiento de póliza de seguro V-010 en 15 días.',
            time: 'Ayer',
            icon: Info
        },
        {
            id: 4,
            type: 'warning',
            message: 'Revisión de frenos recomendada para Van V-007.',
            time: 'Ayer',
            icon: AlertTriangle
        },
        {
            id: 5,
            type: 'danger',
            message: 'Chofer J. Pérez reportó incidente menor con V-002.',
            time: 'Hace 2 días',
            icon: AlertCircle
        },
    ];

    const getAlertColor = (type) => {
        switch (type) {
            case 'danger': return 'text-[var(--color-danger)] bg-[var(--color-danger)]/10 border-[var(--color-danger)]/20';
            case 'warning': return 'text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20';
            case 'info': return 'text-[var(--color-info)] bg-[var(--color-info)]/10 border-[var(--color-info)]/20';
            default: return 'text-[var(--color-text-primary)] bg-[var(--color-bg-tertiary)] border-[var(--color-border)]';
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'danger': return 'text-[var(--color-danger)]';
            case 'warning': return 'text-[var(--color-warning)]';
            case 'info': return 'text-[var(--color-info)]';
            default: return 'text-[var(--color-text-muted)]';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div className="transition-transform duration-300 hover:-translate-y-1" key={index}>
                        <StatCard {...stat} />
                    </div>
                ))}
            </div>

            {/* Charts & Alerts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Chart (2/3 width) */}
                <div className="lg:col-span-2">
                    <Card padding="md" className="h-full">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                            <div>
                                <CardTitle>Consumo vs Kilometraje</CardTitle>
                                <p className="text-sm text-[var(--color-text-muted)] mt-1">Últimos 7 días</p>
                            </div>
                            <div className="relative">
                                <select className="appearance-none bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:border-[var(--color-primary)] transition-colors">
                                    <option>Toda la flota</option>
                                    <option>Autobuses</option>
                                    <option>Camionetas/Vans</option>
                                    <option>Sedanes</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72 w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                        <XAxis 
                                            dataKey="day" 
                                            stroke="var(--color-text-muted)" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false}
                                        />
                                        <YAxis 
                                            yAxisId="left" 
                                            stroke="var(--color-text-muted)" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                        />
                                        <YAxis 
                                            yAxisId="right" 
                                            orientation="right" 
                                            stroke="var(--color-text-muted)" 
                                            fontSize={12} 
                                            tickLine={false} 
                                            axisLine={false} 
                                        />
                                        <Tooltip 
                                            cursor={{fill: 'var(--color-bg-tertiary)'}}
                                            contentStyle={{
                                                backgroundColor: 'var(--color-bg-elevated)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px',
                                                color: 'var(--color-text-primary)'
                                            }}
                                            itemStyle={{ color: 'var(--color-text-primary)' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar yAxisId="left" dataKey="consumido" name="Consumo (L)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        <Bar yAxisId="right" dataKey="kms" name="Kilometraje (km)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Alerts Feed (1/3 width) */}
                <div className="lg:col-span-1">
                    <Card padding="none" className="h-full flex flex-col">
                        <div className="p-4 border-b border-[var(--color-border)] shrink-0">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />
                                Alertas Críticas
                            </h3>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">Notificaciones recientes de monitoreo</p>
                        </div>
                        
                        <div className="p-4 overflow-y-auto min-h-[300px] h-[340px] custom-scrollbar space-y-3">
                            {alerts.map((alert) => {
                                const Icon = alert.icon;
                                return (
                                    <div 
                                        key={alert.id}
                                        className={`p-3 rounded-lg border flex gap-3 transition-colors hover:brightness-110 ${getAlertColor(alert.type)}`}
                                    >
                                        <div className="shrink-0 mt-0.5">
                                            <Icon className={`w-5 h-5 ${getIconColor(alert.type)}`} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-snug">{alert.message}</p>
                                            <p className="text-xs opacity-80 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {alert.time}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}