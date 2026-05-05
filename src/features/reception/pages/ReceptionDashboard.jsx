import { useMemo } from 'react';
import { BedDouble, LogIn, LogOut, Users, DollarSign, Calendar, Home, Percent } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import StatCard from '@shared/common/StatCard';
import Card from '@shared/common/Card';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import { useReceptionDashboard } from '@features/reception/hooks/useReception';

export default function ReceptionDashboard() {
    const { dashboard, isLoading, error } = useReceptionDashboard();

    const occupancyRate = useMemo(() => {
        if (!dashboard || dashboard.total_rooms === 0) return 0;
        return Math.round((dashboard.occupied / dashboard.total_rooms) * 100);
    }, [dashboard]);

    const stats = useMemo(() => {
        if (!dashboard) return [];
        const occ = dashboard.occupied || 0;
        const avail = dashboard.available || 0;
        const blocked = dashboard.blocked || 0;
        const total = dashboard.total_rooms || 0;
        
        return [
            {
                label: 'Ocupación',
                value: `${occ}/${total}`,
                sub: `${occupancyRate}%`,
                icon: Percent,
                color: occupancyRate >= 80 ? 'success' : occupancyRate >= 50 ? 'warning' : 'danger',
            },
            {
                label: 'Llegadas Hoy',
                value: dashboard.arrivals_today || 0,
                icon: LogIn,
                color: 'primary',
            },
            {
                label: 'Salidas Hoy',
                value: dashboard.departures_today || 0,
                icon: LogOut,
                color: 'secondary',
            },
            {
                label: 'En Casa',
                value: dashboard.in_house || 0,
                icon: Home,
                color: 'info',
            },
            {
                label: 'Disponibles',
                value: avail,
                sub: `${blocked} bloqueadas`,
                icon: BedDouble,
                color: avail > 10 ? 'success' : 'warning',
            },
            {
                label: 'Ingresos Mes',
                value: `$${(dashboard.month_revenue || 0).toLocaleString('es-VE')}`,
                sub: `BCV: Bs. ${(dashboard.bcv_rate || 36.50).toFixed(2)}`,
                icon: DollarSign,
                color: 'success',
            },
        ];
    }, [dashboard, occupancyRate]);

    if (isLoading) {
        return (
            <PageWrapper title="Dashboard Recepción">
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            </PageWrapper>
        );
    }

    if (error) {
        return (
            <PageWrapper title="Dashboard Recepción">
                <div className="text-center py-12">
                    <p className="text-[var(--color-text-muted)]">Error al cargar: {error}</p>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title="Dashboard Recepción">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                {stats.map((stat) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        sub={stat.sub}
                        icon={stat.icon}
                        variant={stat.color}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Estado de Habitaciones" icon={BedDouble}>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-[var(--color-success)]/10 rounded-lg">
                            <div className="text-2xl font-bold text-[var(--color-success)]">
                                {dashboard?.occupied || 0}
                            </div>
                            <div className="text-sm text-[var(--color-text-muted)]">Ocupadas</div>
                        </div>
                        <div className="p-4 bg-[var(--color-primary)]/10 rounded-lg">
                            <div className="text-2xl font-bold text-[var(--color-primary)]">
                                {dashboard?.available || 0}
                            </div>
                            <div className="text-sm text-[var(--color-text-muted)]">Disponibles</div>
                        </div>
                        <div className="p-4 bg-[var(--color-warning)]/10 rounded-lg">
                            <div className="text-2xl font-bold text-[var(--color-warning)]">
                                {dashboard?.blocked || 0}
                            </div>
                            <div className="text-sm text-[var(--color-text-muted)]">Bloqueadas</div>
                        </div>
                    </div>
                </Card>

                <Card title="Movimiento Hoy" icon={Calendar}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-[var(--color-success)]/10 rounded-lg">
                            <LogIn className="w-8 h-8 text-[var(--color-success)]" />
                            <div>
                                <div className="text-2xl font-bold">{dashboard?.arrivals_today || 0}</div>
                                <div className="text-sm text-[var(--color-text-muted)]">Llegadas</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-[var(--color-secondary)]/10 rounded-lg">
                            <LogOut className="w-8 h-8 text-[var(--color-secondary)]" />
                            <div>
                                <div className="text-2xl font-bold">{dashboard?.departures_today || 0}</div>
                                <div className="text-sm text-[var(--color-text-muted)]">Salidas</div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </PageWrapper>
    );
}