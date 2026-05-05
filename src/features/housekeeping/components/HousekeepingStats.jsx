import { BedDouble, Sparkles, CircleCheck, Clock, Wrench, ClipboardCheck } from 'lucide-react';

export default function HousekeepingStats({ stats }) {
    if (!stats) {
        return (
            <div className="space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                        <div className="w-3.5 h-3.5 rounded bg-[var(--color-border)]" />
                        <div className="w-6 h-3 rounded bg-[var(--color-border)]" />
                        <div className="w-16 h-2 rounded bg-[var(--color-border)]" />
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--color-border)] shrink-0">
                                <div className="w-3 h-3 rounded bg-[var(--color-border)]" />
                                <div className="w-4 h-3 rounded bg-[var(--color-border)]" />
                                <div className="w-14 h-2 rounded bg-[var(--color-border)]" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shrink-0">
                            <div className="h-2 w-2 rounded-full bg-[var(--color-border)]" />
                            <div className="w-20 h-3 rounded bg-[var(--color-border)]" />
                            <div className="w-8 h-2 rounded bg-[var(--color-border)]" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const roomStatuses = stats.room_statuses || {};
    const assignments = stats.assignments || {};
    const inspection = stats.inspection || {};
    const staffLoad = stats.staff_load || [];

    const statCards = [
        {
            label: 'Sucias',
            count: roomStatuses.dirty || 0,
            icon: Sparkles,
            color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        },
        {
            label: 'Limpias',
            count: roomStatuses.clean || 0,
            icon: CircleCheck,
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        },
        {
            label: 'Inspección',
            count: roomStatuses.inspection || 0,
            icon: ClipboardCheck,
            color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        },
        {
            label: 'Mantenimiento',
            count: roomStatuses.maintenance || 0,
            icon: Wrench,
            color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
        },
        {
            label: 'Asignadas',
            count: assignments.assigned || 0,
            icon: Clock,
            color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        },
        {
            label: 'En progreso',
            count: assignments.in_progress || 0,
            icon: Sparkles,
            color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        },
        {
            label: 'Pendiente insp.',
            count: inspection.pending || 0,
            icon: ClipboardCheck,
            color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        },
        {
            label: 'Completadas hoy',
            count: assignments.completed || 0,
            icon: CircleCheck,
            color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        },
    ];

    const total = (roomStatuses.dirty || 0) + (roomStatuses.clean || 0) + (roomStatuses.maintenance || 0) + (roomStatuses.inspection || 0);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                    <BedDouble className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <span className="text-sm font-bold">{total}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">hab totales</span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                    {statCards.map(card => (
                        <div
                            key={card.label}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg border shrink-0 ${card.color}`}
                        >
                            <card.icon className="w-3 h-3" />
                            <span className="text-xs font-bold">{card.count}</span>
                            <span className="text-[10px] opacity-70">{card.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {staffLoad.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                    {staffLoad.map(s => (
                        <div
                            key={s.id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shrink-0"
                        >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="text-xs">{s.full_name}</span>
                            <span className="text-[10px] font-bold text-[var(--color-text-muted)]">
                                {s.assigned_count || 0} hab
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
