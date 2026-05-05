import { useState, useCallback, useEffect } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, Users, ArrowRight } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import { apiFetch } from '@utils/api';

export default function HousekeepingDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDashboard = useCallback(async () => {
        try {
            const result = await apiFetch('/api/housekeeping/dashboard');
            setData(result.dashboard);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    if (loading) {
        return (
            <PageWrapper title="Dashboard Housekeeping" subtitle="Métricas y rendimiento del equipo" icon={BarChart3}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-border)] mb-2" />
                            <div className="w-12 h-6 rounded bg-[var(--color-border)] mb-1" />
                            <div className="w-16 h-2 rounded bg-[var(--color-border)]" />
                        </div>
                    ))}
                </div>
            </PageWrapper>
        );
    }

    if (!data) {
        return (
            <PageWrapper title="Dashboard Housekeeping" subtitle="Métricas y rendimiento del equipo" icon={BarChart3}>
                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}
            </PageWrapper>
        );
    }

    const rooms = data.rooms;
    const assignments = data.assignments;
    const incidents = data.incidents;
    const staffPerformance = data.staff_performance;

    const roomMetrics = [
        { label: 'Total hab.', value: rooms.total, icon: Users, color: 'text-[var(--color-text-primary)]' },
        { label: 'Limpias', value: rooms.clean, icon: CheckCircle, color: 'text-emerald-400' },
        { label: 'Sucias', value: rooms.dirty, icon: Clock, color: 'text-yellow-400' },
        { label: 'Mantenimiento', value: rooms.maintenance, icon: AlertTriangle, color: 'text-gray-400' },
        { label: '% Limpieza', value: `${rooms.clean_percentage}%`, icon: TrendingUp, color: rooms.clean_percentage >= 80 ? 'text-emerald-400' : rooms.clean_percentage >= 50 ? 'text-yellow-400' : 'text-red-400' },
        { label: 'En inspección', value: rooms.inspection, icon: CheckCircle, color: 'text-purple-400' },
        { label: 'Asignadas hoy', value: assignments.total, icon: Users, color: 'text-blue-400' },
        { label: 'Pendiente insp.', value: assignments.pending_inspection, icon: Clock, color: 'text-orange-400' },
    ];

    return (
        <PageWrapper title="Dashboard Housekeeping" subtitle="Métricas y rendimiento del equipo" icon={BarChart3}>
            <div className="space-y-4">
                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Room Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {roomMetrics.map(m => {
                        const Icon = m.icon;
                        return (
                            <div key={m.label} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon className={`w-4 h-4 ${m.color}`} />
                                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{m.label}</span>
                                </div>
                                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Clean Percentage Bar */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[var(--color-text-muted)]">Progreso de limpieza</span>
                        <span className="text-sm font-bold">{rooms.clean_percentage}%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-emerald-400"
                            style={{ width: `${rooms.clean_percentage}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-[var(--color-text-muted)]">
                        <span>{rooms.clean} limpias</span>
                        <span>{rooms.dirty} sucias</span>
                    </div>
                </div>

                {/* Incidents Summary */}
                {incidents.open > 0 && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-sm font-bold text-red-400">{incidents.open} incidencias abiertas</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {incidents.critical > 0 && (
                                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1 text-center">
                                    <p className="text-sm font-bold text-red-400">{incidents.critical}</p>
                                    <p className="text-[10px] text-red-400/70">Críticas</p>
                                </div>
                            )}
                            {incidents.high > 0 && (
                                <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-2 py-1 text-center">
                                    <p className="text-sm font-bold text-orange-400">{incidents.high}</p>
                                    <p className="text-[10px] text-orange-400/70">Altas</p>
                                </div>
                            )}
                            {incidents.medium > 0 && (
                                <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 text-center">
                                    <p className="text-sm font-bold text-yellow-400">{incidents.medium}</p>
                                    <p className="text-[10px] text-yellow-400/70">Medias</p>
                                </div>
                            )}
                            {incidents.low > 0 && (
                                <div className="rounded-lg bg-gray-500/10 border border-gray-500/20 px-2 py-1 text-center">
                                    <p className="text-sm font-bold text-gray-400">{incidents.low}</p>
                                    <p className="text-[10px] text-gray-400/70">Bajas</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Staff Performance Table */}
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--color-border)]/50">
                        <h3 className="text-sm font-bold">Rendimiento del Equipo</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-[var(--color-border)]/50 text-[var(--color-text-muted)]">
                                    <th className="text-left px-4 py-2 font-medium">Camarera</th>
                                    <th className="text-center px-2 py-2 font-medium">Asignadas</th>
                                    <th className="text-center px-2 py-2 font-medium">Completadas</th>
                                    <th className="text-center px-2 py-2 font-medium">En progreso</th>
                                    <th className="text-center px-2 py-2 font-medium">Tiempo prom.</th>
                                    <th className="text-center px-2 py-2 font-medium">Eficiencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {staffPerformance.map(s => {
                                    const efficiency = s.total_assigned > 0 ? Math.round(s.completed / s.total_assigned * 100) : 0;
                                    return (
                                        <tr key={s.id} className="border-b border-[var(--color-border)]/30 hover:bg-[var(--color-bg-tertiary)]/30 transition-colors">
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                                    <span className="font-medium">{s.full_name}</span>
                                                    <span className="text-[10px] text-[var(--color-text-muted)]">
                                                        {s.role === 'supervisor' ? 'Sup.' : 'Cam.'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-center px-2 py-2">{s.total_assigned}</td>
                                            <td className="text-center px-2 py-2 text-emerald-400 font-medium">{s.completed}</td>
                                            <td className="text-center px-2 py-2 text-orange-400">{s.in_progress}</td>
                                            <td className="text-center px-2 py-2">
                                                {s.avg_minutes ? `${s.avg_minutes} min` : '—'}
                                            </td>
                                            <td className="text-center px-2 py-2">
                                                <div className="flex items-center gap-1.5 justify-center">
                                                    <div className="w-12 h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${efficiency >= 80 ? 'bg-emerald-500' : efficiency >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                            style={{ width: `${efficiency}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-medium">{efficiency}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}
