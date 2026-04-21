import React from 'react';
import { 
    Download, 
    Calendar,
    TrendingUp,
    TrendingDown,
    Activity,
    Filter
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@shared/common/Card';
import Button from '@shared/common/Button';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

export default function AnalyticsTab() {
    // Datos simulados para gráficos
    const costData = [
        { month: 'Ene', combustible: 1200, mantenimiento: 400 },
        { month: 'Feb', combustible: 1350, mantenimiento: 300 },
        { month: 'Mar', combustible: 1100, mantenimiento: 800 },
        { month: 'Abr', combustible: 1400, mantenimiento: 200 },
        { month: 'May', combustible: 1250, mantenimiento: 550 },
        { month: 'Jun', combustible: 1500, mantenimiento: 450 },
    ];

    const distributionData = [
        { name: 'Autobuses', value: 45, color: '#3b82f6' }, // Blue
        { name: 'Camionetas', value: 35, color: '#10b981' }, // Emerald
        { name: 'Sedanes', value: 20, color: '#8b5cf6' }, // Indigo
    ];

    const summaryMetrics = [
        {
            title: 'Gasto Total (YTD)',
            value: '$11,500',
            trend: '+12.5%',
            positive: false,
            icon: Activity
        },
        {
            title: 'Eficiencia de Combustible',
            value: '8.2 km/L',
            trend: '+5.2%',
            positive: true,
            icon: TrendingUp
        },
        {
            title: 'Costo de Mantenimiento',
            value: '$2,700',
            trend: '-2.4%',
            positive: true,
            icon: TrendingDown
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header de la vista */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Analíticas y Reportes</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Métricas operativas consolidadas de la flota</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="outline" icon={Filter} className="!rounded-full">Filtros</Button>
                    <Button variant="primary" icon={Download} className="!rounded-full shadow-sm">Exportar PDF</Button>
                </div>
            </div>

            {/* Tarjetas de Resumen (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summaryMetrics.map((metric, idx) => {
                    const Icon = metric.icon;
                    return (
                        <Card key={idx} className="p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-sm font-medium text-[var(--color-text-muted)]">{metric.title}</p>
                                <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                                    <Icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                </div>
                            </div>
                            <div className="flex items-end justify-between">
                                <h4 className="text-2xl font-bold text-[var(--color-text-primary)]">{metric.value}</h4>
                                <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                                    metric.positive 
                                    ? 'bg-emerald-500/10 text-emerald-600' 
                                    : 'bg-rose-500/10 text-rose-600'
                                }`}>
                                    {metric.trend}
                                </span>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Gráfico de Área: Evolución de Costos */}
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader className="border-b border-[var(--color-border)] pb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-base font-semibold">Evolución de Costos Operativos</CardTitle>
                                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Comparativa mensual Combustible vs Mantenimiento (USD)</p>
                                </div>
                                <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-3 py-1.5 rounded-lg border border-[var(--color-border)]">
                                    <Calendar className="w-4 h-4" />
                                    <span>Últimos 6 meses</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={costData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCombustible" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorMantenimiento" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                                        <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                        <RechartsTooltip 
                                            contentStyle={{
                                                backgroundColor: 'var(--color-bg-elevated)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px',
                                                color: 'var(--color-text-primary)'
                                            }}
                                            itemStyle={{ fontWeight: 500 }}
                                        />
                                        <Legend verticalAlign="top" height={36} />
                                        <Area type="monotone" name="Combustible" dataKey="combustible" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorCombustible)" />
                                        <Area type="monotone" name="Mantenimiento" dataKey="mantenimiento" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMantenimiento)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Gráfico Circular: Distribución de la Flota */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader className="border-b border-[var(--color-border)] pb-4">
                            <CardTitle className="text-base font-semibold">Gasto por Categoría</CardTitle>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">Acumulado del año</p>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[240px] w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={distributionData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {distributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{
                                                backgroundColor: 'var(--color-bg-elevated)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px'
                                            }}
                                            itemStyle={{ color: 'var(--color-text-primary)' }}
                                            formatter={(value) => [`${value}%`, 'Distribución']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            
                            {/* Leyenda Personalizada para mejor alineación en Tailwind */}
                            <div className="flex flex-col gap-3 mt-4">
                                {distributionData.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-sm text-[var(--color-text-secondary)]">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">{item.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}