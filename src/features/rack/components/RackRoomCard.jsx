import { getRackState, getStateColors, RACK_STATE_LABELS, formatShortDate } from '../utils/rackHelpers';

export default function RackRoomCard({ room, onClick }) {
    const state = getRackState(room);
    const colors = getStateColors(state);

    const hasGuest = Boolean(room.guest_name);
    const hasDates = Boolean(room.reservation_check_in);
    const showGuest = hasGuest && (state === 'occupied' || state === 'reserved');
    const showDates = hasDates && (state === 'occupied' || state === 'reserved');

    return (
        <button
            type="button"
            onClick={() => onClick(room)}
            className="group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 p-2.5 text-left transition-all hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg-primary)]/60 hover:shadow-md flex flex-col min-h-[130px]"
        >
            <div className="flex items-start justify-between">
                <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                            {room.floor_code}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Hab.</span>
                    </div>
                    <div className="mt-1">
                        <p className="text-base font-bold leading-tight text-[var(--color-text-primary)] text-center w-full">{room.room_number}</p>
                    </div>
                </div>
                <span
                    className={`mt-0.5 inline-flex h-2.5 w-2.5 rounded-full ${colors.dot}`}
                    aria-label={RACK_STATE_LABELS[state]}
                    title={RACK_STATE_LABELS[state]}
                />
            </div>

            <div className="flex-1 flex flex-col justify-center gap-1 mt-1">
                <p className="text-[10px] text-[var(--color-text-muted)] truncate">{room.room_type_name}</p>

                {showGuest ? (
                    <p className="text-[10px] font-medium text-[var(--color-text-secondary)] truncate">{room.guest_name}</p>
                ) : (
                    <div className="h-4" />
                )}

                {showDates ? (
                    <p className="text-[10px] font-medium text-[var(--color-text-secondary)]">
                        {state === 'occupied'
                            ? `${formatShortDate(room.reservation_check_in)} → ${formatShortDate(room.reservation_check_out)}`
                            : `${formatShortDate(room.reservation_check_in)} entrada`
                        }
                    </p>
                ) : (
                    <div className="h-4" />
                )}
            </div>
        </button>
    );
}
