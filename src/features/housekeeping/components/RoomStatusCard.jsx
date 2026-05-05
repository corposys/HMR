import { BedDouble, User, Calendar, Wrench } from 'lucide-react';
import { ASSIGNMENT_STATUSES } from '../hooks/useHousekeeping';

const STATUS_ACTIONS = {
    assigned: { label: 'Iniciar', next: 'in_progress' },
    in_progress: { label: 'Completar', next: 'completed' },
};

export default function RoomStatusCard({ room, onStatusChange, onClick }) {
    const assignmentStatus = room.assignment_status;
    const action = STATUS_ACTIONS[assignmentStatus];

    return (
        <div
            className="group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2.5 cursor-pointer hover:border-[var(--color-primary)]/40 transition-all duration-150"
            onClick={() => onClick?.(room)}
        >
            {room.staff_color && (
                <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                    style={{ backgroundColor: room.staff_color }}
                />
            )}

            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                    <BedDouble className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <span className="text-sm font-bold">{room.room_number}</span>
                </div>
                {room.room_type_name && (
                    <span className="text-[10px] text-[var(--color-text-muted)]">{room.room_type_name}</span>
                )}
            </div>

            {room.guest_name && (
                <div className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] truncate mb-1">
                    <User className="w-3 h-3 shrink-0" />
                    {room.guest_name}
                </div>
            )}

            {room.check_out_date && (
                <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] mb-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {new Date(room.check_out_date).toLocaleDateString('es-VE')}
                </div>
            )}

            {room.housekeeping_status === 'maintenance' && (
                <div className="flex items-center gap-1 text-[10px] text-orange-400">
                    <Wrench className="w-3 h-3" />
                    Mantenimiento
                </div>
            )}

            {room.staff_name && (
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)]/50">
                    <div className="flex items-center gap-1">
                        <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: room.staff_color }}
                        />
                        <span className="text-[10px] text-[var(--color-text-muted)] truncate">{room.staff_name}</span>
                    </div>

                    {action && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(room.assignment_id, action.next);
                            }}
                            className="text-[10px] font-medium text-[var(--color-primary)] hover:underline"
                        >
                            {action.label}
                        </button>
                    )}

                    {!action && assignmentStatus === 'completed' && (
                        <span className="text-[10px] text-emerald-400 font-medium">Completada</span>
                    )}
                </div>
            )}
        </div>
    );
}

export function RoomStatusCardSkeleton() {
    return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-2.5 animate-pulse">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 rounded bg-[var(--color-border)]" />
                    <div className="w-8 h-3 rounded bg-[var(--color-border)]" />
                </div>
                <div className="w-12 h-2 rounded bg-[var(--color-border)]" />
            </div>
            <div className="w-full h-2.5 rounded bg-[var(--color-border)] mb-1" />
            <div className="w-2/3 h-2 rounded bg-[var(--color-border)] mb-1" />
            <div className="mt-2 pt-2 border-t border-[var(--color-border)]/50 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[var(--color-border)]" />
                    <div className="w-16 h-2 rounded bg-[var(--color-border)]" />
                </div>
                <div className="w-10 h-2 rounded bg-[var(--color-border)]" />
            </div>
        </div>
    );
}
