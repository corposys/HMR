import { Clock, CheckCircle, AlertTriangle, XCircle, TrendingUp, X } from 'lucide-react';

export default function StaffPerformanceCard({ staff, performance, onClose }) {
    if (!performance) return null;

    const metrics = [
        {
            label: 'Completadas',
            value: performance.completed,
            icon: CheckCircle,
            color: 'text-emerald-400 bg-emerald-500/10',
        },
        {
            label: 'Tiempo promedio',
            value: performance.avg_minutes ? `${performance.avg_minutes} min` : 'N/A',
            icon: Clock,
            color: 'text-blue-400 bg-blue-500/10',
        },
        {
            label: 'Tasa aprobación',
            value: performance.approval_rate !== null ? `${performance.approval_rate}%` : 'N/A',
            icon: TrendingUp,
            color: 'text-purple-400 bg-purple-500/10',
        },
        {
            label: 'Rechazadas',
            value: performance.rejected,
            icon: XCircle,
            color: 'text-red-400 bg-red-500/10',
        },
        {
            label: 'Incidencias',
            value: performance.incidents,
            icon: AlertTriangle,
            color: 'text-yellow-400 bg-yellow-500/10',
        },
    ];

    return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]/50">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: staff.color }}
                    >
                        {staff.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                        <p className="text-sm font-bold">{staff.full_name}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">
                            Últimos {performance.period_days} día{performance.period_days > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                    <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-4">
                {metrics.map(m => {
                    const Icon = m.icon;
                    return (
                        <div key={m.label} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Icon className={`w-3.5 h-3.5 ${m.color.split(' ')[0]}`} />
                                <span className="text-[10px] text-[var(--color-text-muted)]">{m.label}</span>
                            </div>
                            <p className="text-lg font-bold">{m.value}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
