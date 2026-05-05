import { BedDouble, User, CalendarClock, Sparkles, Wrench, Ban, XOctagon } from 'lucide-react';
import { getRackState, getStateColors, RACK_STATE_LABELS, getGuestShortName, formatCurrency, formatShortDate } from '../utils/rackHelpers';

const STATE_ICONS = {
    available: BedDouble,
    occupied: User,
    reserved: CalendarClock,
    dirty: Sparkles,
    maintenance: Wrench,
    blocked: Ban,
    fdu: XOctagon,
};

const VIEW_CONFIG = {
    compact: {
        card: 'h-14 w-16',
        number: 'text-sm',
        showType: false,
        showGuest: false,
        showPrice: false,
        showIcon: true,
        showDot: true,
        gridCols: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12',
        gap: 'gap-1',
    },
    normal: {
        card: 'h-[72px] w-24',
        number: 'text-base',
        showType: true,
        showGuest: true,
        showPrice: true,
        showIcon: false,
        showDot: true,
        gridCols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8',
        gap: 'gap-2',
    },
    expanded: {
        card: 'h-28 w-40',
        number: 'text-lg',
        showType: true,
        showGuest: true,
        showPrice: true,
        showIcon: false,
        showDot: true,
        gridCols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        gap: 'gap-2',
    },
};

export default function RackRoomCard({ room, viewMode, onClick }) {
    const state = getRackState(room);
    const label = RACK_STATE_LABELS[state];
    const colors = getStateColors(state);
    const config = VIEW_CONFIG[viewMode] || VIEW_CONFIG.normal;
    const StateIcon = STATE_ICONS[state];

    const tooltipLines = [
        `Hab. ${room.room_number} — ${label}`,
        room.room_type_name,
        room.guest_name ? `Huésped: ${room.guest_name}` : null,
        room.plan_name ? `Plan: ${room.plan_name}` : null,
        room.reservation_check_in
            ? `Fechas: ${formatShortDate(room.reservation_check_in)} → ${formatShortDate(room.reservation_check_out)}`
            : null,
        room.nightly_rate_usd ? `Tarifa: ${formatCurrency(room.nightly_rate_usd)}/noche` : null,
        room.is_blocked && room.blocked_reason ? `Motivo: ${room.blocked_reason}` : null,
    ].filter(Boolean);

    return (
        <button
            onClick={() => onClick(room)}
            title={tooltipLines.join('\n')}
            className={`
                group relative flex flex-col items-center justify-center rounded-lg border text-center
                transition-all duration-150
                hover:scale-[1.03] hover:z-10 hover:shadow-lg
                ${colors.bg} ${colors.border} ${colors.hover}
                ${config.card}
            `}
        >
            {/* Dot */}
            {config.showDot && (
                <span className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full ${colors.dot}`} />
            )}

            {/* Room number */}
            <span className={`font-bold ${colors.text} ${config.number} leading-none`}>
                {room.room_number}
            </span>

            {/* Icon (compact only) */}
            {config.showIcon && StateIcon && (
                <StateIcon className={`w-3.5 h-3.5 mt-1 ${colors.text} opacity-60`} />
            )}

            {/* Type (normal/expanded) */}
            {config.showType && room.room_type_name && (
                <span className={`text-[10px] ${colors.text} opacity-70 mt-0.5 truncate max-w-[90%]`}>
                    {room.room_type_name.length > 14 ? room.room_type_name.slice(0, 12) + '...' : room.room_type_name}
                </span>
            )}

            {/* Guest (normal/expanded) */}
            {config.showGuest && room.guest_name && (
                <span className={`text-[10px] ${colors.text} opacity-80 truncate max-w-[90%]`}>
                    {getGuestShortName(room.guest_name)}
                </span>
            )}

            {/* Price (normal/expanded) */}
            {config.showPrice && room.nightly_rate_usd && (
                <span className={`text-[10px] ${colors.text} opacity-60 mt-0.5`}>
                    {formatCurrency(room.nightly_rate_usd)}
                </span>
            )}

            {/* Dates (expanded only) */}
            {viewMode === 'expanded' && room.reservation_check_in && (
                <span className={`text-[9px] ${colors.text} opacity-50 mt-0.5`}>
                    {formatShortDate(room.reservation_check_in)} → {formatShortDate(room.reservation_check_out)}
                </span>
            )}

            {/* FDU label */}
            {state === 'fdu' && (
                <span className="absolute bottom-1 left-0 right-0 text-[7px] font-bold uppercase text-purple-400/60 leading-none">
                    FDU
                </span>
            )}
        </button>
    );
}
