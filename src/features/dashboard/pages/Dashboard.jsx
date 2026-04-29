import {
    LayoutDashboard,
    CalendarCheck,
    Users,
    BedDouble,
    Banknote,
    Activity,
    Clock,
    Hotel
} from 'lucide-react';
import StatCard from '@shared/common/StatCard';
import Card, { CardHeader, CardTitle, CardContent } from '@shared/common/Card';
import Button from '@shared/common/Button';
import { Link } from 'react-router-dom';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

/**
 * Dashboard - Vista principal de HMR (Hotel Management System)
 */
export default function Dashboard() {
    // Datos de ejemplo para las estadísticas
    const stats = [
        {
            title: 'Reservas Activas',
            value: '142',
            subtitle: '12 por ingresar hoy',
            icon: CalendarCheck,
            trend: 8,
            trendLabel: 'vs. mes anterior',
            variant: 'default'
        },
        {
            title: 'Tasa de Ocupación',
            value: '85.2%',
            subtitle: 'Últimos 30 días',
            icon: BedDouble,
            trend: 12.5,
            trendLabel: 'incremento',
            variant: 'default'
        },
        {
            title: 'Huéspedes Actuales',
            value: '320',
            subtitle: 'En las instalaciones',
            icon: Users,
            trend: -3.2,
            trendLabel: 'vs. semana anterior',
            variant: 'warning'
        },
        {
            title: 'Ingresos del mes',
            value: '$45,230',
            subtitle: 'Proyección superada',
            icon: Banknote,
            trend: 15,
            trendLabel: 'crecimiento mensual',
            variant: 'success'
        },
    ];

    // Datos para el gráfico de tendencia
    const trendData = [
        { date: 'Ene', ocupacion: 65, ingresos: 32000, reservas: 150 },
        { date: 'Feb', ocupacion: 72, ingresos: 38000, reservas: 180 },
        { date: 'Mar', ocupacion: 68, ingresos: 35000, reservas: 165 },
        { date: 'Abr', ocupacion: 75, ingresos: 42000, reservas: 195 },
        { date: 'May', ocupacion: 70, ingresos: 39000, reservas: 175 },
        { date: 'Jun', ocupacion: 85, ingresos: 45230, reservas: 240 },
    ];

    // Datos de desempeño por aplicación integrada
    const moduleData = [
        { name: 'Reservas', uso: 95 },
        { name: 'Housekeeping', uso: 82 },
        { name: 'Restaurante', uso: 75 },
        { name: 'Spa', uso: 45 },
        { name: 'Mantenimiento', uso: 60 },
    ];

    // Actividad reciente
    const recentActivity = [
        { type: 'checkin', user: 'Familia Perez (Hab 304)', app: 'Recepción', time: 'Hace 5 min' },
        { type: 'service', user: 'Servicio a la Habitación (Hab 210)', app: 'Restaurante', time: 'Hace 12 min' },
        { type: 'checkout', user: 'Carlos Lopez (Hab 105)', app: 'Recepción', time: 'Hace 24 min' },
        { type: 'cleaning', user: 'Limpieza completada (Hab 402)', app: 'Housekeeping', time: 'Hace 38 min' },
        { type: 'reservation', user: 'Nueva reserva (3 noches)', app: 'Motor Reservas', time: 'Hace 1 hora' },
    ];

    const getActivityIcon = (type) => {
        switch (type) {
            case 'checkin': return <CalendarCheck className="w-4 h-4 text-[var(--color-success)]" />;
            case 'service': return <Banknote className="w-4 h-4 text-[var(--color-info)]" />;
            case 'checkout': return <Clock className="w-4 h-4 text-[var(--color-warning)]" />;
            case 'cleaning': return <BedDouble className="w-4 h-4 text-[var(--color-primary)]" />;
            default: return <Activity className="w-4 h-4" />;
        }
    };

    const getActivityLabel = (type) => {
        switch (type) {
            case 'checkin': return 'Check-in';
            case 'service': return 'Cargo a habitación';
            case 'checkout': return 'Check-out';
            case 'cleaning': return 'Housekeeping';
            case 'reservation': return 'Nueva Reserva';
            default: return 'Actividad';
        }
    };

    return (
        <div className="py-6 w-full px-4 lg:px-8">
            <div className="mx-auto max-w-auto">
                {/* Header Section */}
                <div className="mb-4 flex justify-end">
                    <Button variant="secondary" icon={Hotel}>
                        Reporte Diario
                    </Button>
                </div>

                {/* Stats Grid - Simétrico 4 columnas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                    ))}
                </div>

                {/* Charts Grid - 2 columnas simétricas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Trend Chart */}
                    <Card padding="md">
                        <CardHeader>
                            <CardTitle>Ocupación e Ingresos</CardTitle>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                Últimos 6 meses
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData}>
                                        <defs>
                                            <linearGradient id="colorOcupacion" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis
                                            dataKey="date"
                                            stroke="var(--color-text-muted)"
                                            fontSize={12}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="var(--color-text-muted)"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--color-bg-elevated)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px',
                                                color: 'var(--color-text-primary)'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="ocupacion"
                                            stroke="#3b82f6"
                                            fillOpacity={1}
                                            fill="url(#colorOcupacion)"
                                            name="Ocupación %"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="ingresos"
                                            stroke="#10b981"
                                            fillOpacity={1}
                                            fill="url(#colorIngresos)"
                                            name="Ingresos"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Department Risk Chart */}
                    <Card padding="md">
                        <CardHeader>
                            <CardTitle>Uso de Módulos (Aplicaciones)</CardTitle>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                Actividad por sistema integrado
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={moduleData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                                        <XAxis
                                            type="number"
                                            stroke="var(--color-text-muted)"
                                            fontSize={12}
                                            tickLine={false}
                                            domain={[0, 100]}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            stroke="var(--color-text-muted)"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            width={100}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--color-bg-elevated)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '8px',
                                                color: 'var(--color-text-primary)'
                                            }}
                                            formatter={(value) => [`${value}%`, 'Actividad']}
                                        />
                                        <Bar
                                            dataKey="uso"
                                            fill="var(--color-primary)"
                                            radius={[0, 4, 4, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
