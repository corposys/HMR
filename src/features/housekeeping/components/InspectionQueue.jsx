import { BedDouble, User, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function InspectionQueueItem({ assignment, onApprove, onReject }) {
    const completedTime = assignment.completed_at
        ? new Date(assignment.completed_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden transition-all duration-150 hover:border-purple-500/30">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]/50">
                <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10">
                        <BedDouble className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <span className="text-base font-bold">{assignment.room_number}</span>
                        {assignment.room_type_name && (
                            <span className="text-[10px] text-[var(--color-text-muted)] ml-1.5">{assignment.room_type_name}</span>
                        )}
                    </div>
                </div>
                {completedTime && (
                    <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                        <Clock className="w-2.5 h-2.5" />
                        Completada a las {completedTime}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: assignment.staff_color }} />
                    <span className="text-xs text-[var(--color-text-muted)]">{assignment.staff_name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onReject(assignment.id)}
                        className="flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all duration-150"
                    >
                        <XCircle className="w-3 h-3" />
                        Rechazar
                    </button>
                    <button
                        onClick={() => onApprove(assignment.id)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all duration-150"
                    >
                        <CheckCircle className="w-3 h-3" />
                        Aprobar
                    </button>
                </div>
            </div>
        </div>
    );
}

export function InspectionQueueItemSkeleton() {
    return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] animate-pulse overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-border)]" />
                    <div className="w-12 h-4 rounded bg-[var(--color-border)]" />
                </div>
                <div className="w-24 h-2.5 rounded bg-[var(--color-border)]" />
            </div>
            <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-border)]" />
                    <div className="w-20 h-2.5 rounded bg-[var(--color-border)]" />
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-16 h-6 rounded-lg bg-[var(--color-border)]" />
                    <div className="w-16 h-6 rounded-lg bg-[var(--color-border)]" />
                </div>
            </div>
        </div>
    );
}
