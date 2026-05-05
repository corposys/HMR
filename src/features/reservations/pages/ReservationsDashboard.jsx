import { useMemo } from 'react';
import { Calendar, LogIn, LogOut, Users, Home, XCircle } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import StatCard from '@shared/common/StatCard';
import Card from '@shared/common/Card';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import { useReservationsDashboard } from '@features/reservations/hooks/useReservations';

export default function ReservationsDashboard() {
    const { dashboard, isLoading, error } = useReservationsDashboard();

    const stats = useMemo(() => {
        if (!dashboard) return [];
        return [
            {
                label: 'Pendientes',
                value: dashboard.pending_arrivals || 0,
                icon: Calendar,
                color: 'warning',
            },
            {
                label: 'Llegadas Hoy',
                value: dashboard.arrivals_today || 0,
                icon: LogIn,
                color: 'success',
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
                color: 'primary',
            },
            {
                label: 'Check-out Mes',
                value: dashboard.checked_out_month || 0,
                icon: Users,
                color: 'info',
            },
            {
                label: 'No Show Hoy',
                value: dashboard.no_shows_today || 0,
                icon: XCircle,
                color: dashboard.no_shows_today > 0 ? 'danger' : 'success',
            },
        ];
    }, [dashboard]);

    if (isLoading) {
        return (
            <PageWrapper title="Dashboard Reservaciones">
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            </PageWrapper>
        );
    }

    if (error) {
        return (
            <PageWrapper title="Dashboard Reservaciones">
                <div className="text-center py-12">
                    <p className="text-[var(--color-text-muted)]">Error al cargar: {error}</p>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title="Dashboard Reservaciones">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                {stats.map((stat) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        icon={stat.icon}
                        variant={stat.color}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Llegadas y Salidas Hoy" icon={Calendar}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-[var(--color-success)]/10 rounded-lg">
                            <LogIn className="w-10 h-10 text-[var(--color-success)]" />
                            <div>
                                <div className="text-3xl font-bold">{dashboard?.arrivals_today || 0}</div>
                                <div className="text-sm text-[var(--color-text-muted)]">Llegadas</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-[var(--color-secondary)]/10 rounded-lg">
                            <LogOut className="w-10 h-10 text-[var(--color-secondary)]" />
                            <div>
                                <div className="text-3xl font-bold">{dashboard?.departures_today || 0}</div>
                                <div className="text-sm text-[var(--color-text-muted)]">Salidas</div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Resumen" icon={Users}>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                            <span className="text-[var(--color-text-secondary)]">Pendientes</span>
                            <span className="font-bold text-[var(--color-warning)]">{dashboard?.pending_arrivals || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                            <span className="text-[var(--color-text-secondary)]">En Casa</span>
                            <span className="font-bold text-[var(--color-primary)]">{dashboard?.in_house || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                            <span className="text-[var(--color-text-secondary)]">Habitaciones</span>
                            <span className="font-bold">{dashboard?.total_rooms || 0}</span>
                        </div>
                    </div>
                </Card>
            </div>
        </PageWrapper>
    );
}