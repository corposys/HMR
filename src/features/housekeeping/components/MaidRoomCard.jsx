import { BedDouble, User, Calendar, Wrench, Play, CheckCircle, AlertTriangle, ClipboardCheck } from 'lucide-react';
import CleaningTimer from './CleaningTimer';

export default function MaidRoomCard({ room, onStatusChange, onReportIncident }) {
    const isAssigned = room.assignment_status === 'assigned';
    const isInProgress = room.assignment_status === 'in_progress';
    const isCompleted = room.assignment_status === 'completed';
    const isInspection = room.housekeeping_status === 'inspection';
    const isMaintenance = room.housekeeping_status === 'maintenance';

    return (
        <div className={`
            rounded-xl border transition-all duration-150 overflow-hidden
            ${isMaintenance
                ? 'border-orange-500/30 bg-orange-500/5'
                : isInspection
                ? 'border-purple-500/30 bg-purple-500/5'
                : isCompleted
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-primary)]/40'
            }
        `}>
            <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                    <div className={`
                        flex items-center justify-center w-8 h-8 rounded-lg
                        ${isMaintenance
                            ? 'bg-orange-500/10'
                            : isInspection
                            ? 'bg-purple-500/10'
                            : isCompleted
                            ? 'bg-emerald-500/10'
                            : 'bg-[var(--color-bg-tertiary)]'
                        }
                    `}>
                        {isMaintenance ? (
                            <Wrench className="w-4 h-4 text-orange-400" />
                        ) : isInspection ? (
                            <ClipboardCheck className="w-4 h-4 text-purple-400" />
                        ) : isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <BedDouble className="w-4 h-4 text-[var(--color-text-muted)]" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-bold">{room.room_number}</span>
                            {room.room_type_name && (
                                <span className="text-[10px] text-[var(--color-text-muted)]">{room.room_type_name}</span>
                            )}
                        </div>
                        {room.guest_name && (
                            <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)]">
                                <User className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate max-w-[160px]">{room.guest_name}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    {isInProgress && room.started_at && (
                        <CleaningTimer startedAt={room.started_at} />
                    )}
                    {room.check_out_date && (
                        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                            <Calendar className="w-2.5 h-2.5 shrink-0" />
                            {new Date(room.check_out_date).toLocaleDateString('es-VE')}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 px-3 pb-2">
                {isMaintenance && (
                    <span className="text-[10px] text-orange-400 font-medium flex items-center gap-1">
                        <Wrench className="w-2.5 h-2.5" />
                        Mantenimiento
                    </span>
                )}

                {isAssigned && (
                    <button
                        onClick={() => onStatusChange(room.assignment_id, 'in_progress')}
                        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-all duration-150"
                    >
                        <Play className="w-3 h-3" />
                        Iniciar limpieza
                    </button>
                )}

                {isInProgress && (
                    <>
                        <button
                            onClick={() => onReportIncident?.(room)}
                            className="flex items-center gap-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 text-xs font-medium text-yellow-400 hover:bg-yellow-500/20 transition-all duration-150"
                        >
                            <AlertTriangle className="w-3 h-3" />
                            Reportar
                        </button>
                        <button
                            onClick={() => onStatusChange(room.assignment_id, 'completed')}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all duration-150"
                        >
                            <CheckCircle className="w-3 h-3" />
                            Completar
                        </button>
                    </>
                )}

                {isInspection && (
                    <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                        <ClipboardCheck className="w-3 h-3" />
                        Pendiente de inspección
                    </span>
                )}

                {isCompleted && !isInspection && (
                    <span className="text-[10px] text-emerald-400 font-semibold">
                        Limpieza completada
                    </span>
                )}
            </div>
        </div>
    );
}

export function MaidRoomCardSkeleton() {
    return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] animate-pulse overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-border)]" />
                    <div>
                        <div className="w-12 h-4 rounded bg-[var(--color-border)] mb-1" />
                        <div className="w-24 h-2.5 rounded bg-[var(--color-border)]" />
                    </div>
                </div>
                <div className="w-16 h-2.5 rounded bg-[var(--color-border)]" />
            </div>
            <div className="flex items-center gap-2 px-3 pb-2">
                <div className="w-24 h-6 rounded-lg bg-[var(--color-border)]" />
            </div>
        </div>
    );
}
