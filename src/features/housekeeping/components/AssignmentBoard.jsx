import { useMemo } from 'react';
import RoomStatusCard, { RoomStatusCardSkeleton } from './RoomStatusCard';
import { KANBAN_COLUMNS, getKanbanStatus } from '../hooks/useHousekeeping';

export default function AssignmentBoard({ rooms, staff, onStatusChange, onRoomClick, onColumnAssign, loading }) {
    const columns = useMemo(() => {
        const grouped = {};
        KANBAN_COLUMNS.forEach(col => {
            grouped[col.key] = { ...col, rooms: [] };
        });

        rooms.forEach(room => {
            const status = getKanbanStatus(room);
            if (grouped[status]) {
                grouped[status].rooms.push(room);
            }
        });

        Object.values(grouped).forEach(col => {
            col.rooms.sort((a, b) => {
                if (a.housekeeping_status === 'maintenance' && b.housekeeping_status !== 'maintenance') return -1;
                if (b.housekeeping_status === 'maintenance' && a.housekeeping_status !== 'maintenance') return 1;
                return a.room_number.localeCompare(b.room_number, undefined, { numeric: true });
            });
        });

        return grouped;
    }, [rooms]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {KANBAN_COLUMNS.map(col => (
                    <div
                        key={col.key}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 flex flex-col min-h-[400px]"
                    >
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--color-border)]/60 border-t-2 border-t-transparent animate-pulse">
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-3 rounded bg-[var(--color-border)]" />
                                <div className="w-4 h-3 rounded bg-[var(--color-border)]" />
                            </div>
                        </div>
                        <div className="flex-1 p-2 space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <RoomStatusCardSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {KANBAN_COLUMNS.map(col => {
                const columnData = columns[col.key];
                return (
                    <div
                        key={col.key}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/60 flex flex-col min-h-[400px]"
                    >
                        <div className={`flex items-center justify-between px-3 py-2.5 border-b border-[var(--color-border)]/60 ${col.color} border-t-2`}>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                                    {col.label}
                                </span>
                                <span className="text-[10px] text-[var(--color-text-muted)]">
                                    {columnData.rooms.length}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-320px)]">
                            {columnData.rooms.length === 0 && (
                                <div className="flex items-center justify-center h-24 text-[10px] text-[var(--color-text-muted)]/50">
                                    Sin habitaciones
                                </div>
                            )}

                            {columnData.rooms.map(room => (
                                <RoomStatusCard
                                    key={room.id}
                                    room={room}
                                    staff={staff}
                                    onStatusChange={onStatusChange}
                                    onClick={onRoomClick}
                                />
                            ))}
                        </div>

                        {col.key === 'dirty' && columnData.rooms.length > 0 && (
                            <div className="px-2 pb-2">
                                <button
                                    onClick={() => onColumnAssign?.(col.key)}
                                    className="w-full rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] transition-colors"
                                >
                                    Asignar camarera
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
