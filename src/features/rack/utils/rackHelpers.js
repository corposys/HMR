import {
    BedDouble,
    User,
    CalendarClock,
    Sparkles,
    Wrench,
    Ban,
    XOctagon,
} from 'lucide-react';

export const RACK_STATES = {
    available: 'available',
    occupied: 'occupied',
    reserved: 'reserved',
    dirty: 'dirty',
    maintenance: 'maintenance',
    blocked: 'blocked',
    fdu: 'fdu',
};

export const RACK_STATE_LABELS = {
    available: 'Disponible',
    occupied: 'Ocupada',
    reserved: 'Reservada',
    dirty: 'Sucia',
    maintenance: 'Mantenimiento',
    blocked: 'Bloqueada',
    fdu: 'FDU',
};

export const RACK_STATE_ICONS = {
    available: BedDouble,
    occupied: User,
    reserved: CalendarClock,
    dirty: Sparkles,
    maintenance: Wrench,
    blocked: Ban,
    fdu: XOctagon,
};

export const RACK_STATE_COLORS = {
    available: {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/40',
        hover: 'hover:bg-emerald-500/20',
        dot: 'bg-emerald-400',
        pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        glow: '#34d399',
    },
    occupied: {
        bg: 'bg-blue-500/15',
        text: 'text-blue-400',
        border: 'border-blue-500/40',
        hover: 'hover:bg-blue-500/20',
        dot: 'bg-blue-400',
        pill: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        glow: '#60a5fa',
    },
    reserved: {
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/40',
        hover: 'hover:bg-amber-500/20',
        dot: 'bg-amber-400',
        pill: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        glow: '#fbbf24',
    },
    dirty: {
        bg: 'bg-red-500/15',
        text: 'text-red-400',
        border: 'border-red-500/40',
        hover: 'hover:bg-red-500/20',
        dot: 'bg-red-400',
        pill: 'bg-red-500/10 text-red-400 border-red-500/20',
        glow: '#f87171',
    },
    maintenance: {
        bg: 'bg-orange-500/15',
        text: 'text-orange-400',
        border: 'border-orange-500/40',
        hover: 'hover:bg-orange-500/20',
        dot: 'bg-orange-400',
        pill: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        glow: '#fb923c',
    },
    blocked: {
        bg: 'bg-gray-500/15',
        text: 'text-[var(--color-text-muted)]',
        border: 'border-gray-500/30',
        hover: 'hover:bg-gray-500/20',
        dot: 'bg-gray-400',
        pill: 'bg-gray-500/10 text-[var(--color-text-muted)] border-gray-500/20',
        glow: '#9ca3af',
    },
    fdu: {
        bg: 'bg-purple-500/15',
        text: 'text-purple-400',
        border: 'border-purple-500/40',
        hover: 'hover:bg-purple-500/20',
        dot: 'bg-purple-400',
        pill: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        glow: '#c084fc',
    },
};

export function getRackState(room) {
    if (room.is_blocked) {
        if (room.blocked_reason && room.blocked_reason.toUpperCase().includes('FDU')) {
            return RACK_STATES.fdu;
        }
        return RACK_STATES.blocked;
    }
    if (room.housekeeping_status === 'maintenance') return RACK_STATES.maintenance;
    if (room.housekeeping_status === 'dirty') return RACK_STATES.dirty;
    if (room.reservation_status === 'checked_in') return RACK_STATES.occupied;
    if (room.reservation_status === 'reserved') return RACK_STATES.reserved;
    return RACK_STATES.available;
}

export function getStateColors(state) {
    return RACK_STATE_COLORS[state] || RACK_STATE_COLORS.blocked;
}

export function getModuleStats(rooms) {
    const stats = {
        total: rooms.length,
        available: 0,
        occupied: 0,
        reserved: 0,
        dirty: 0,
        maintenance: 0,
        blocked: 0,
        fdu: 0,
    };
    rooms.forEach(room => {
        const state = getRackState(room);
        if (stats[state] !== undefined) stats[state]++;
    });
    return stats;
}

export function formatShortDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
}

export function formatCurrency(value) {
    if (value === null || value === undefined) return '$0.00';
    return `$${Number(value).toFixed(2)}`;
}

export function getGuestShortName(fullName) {
    if (!fullName) return '';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    const firstInitial = parts[0][0];
    return `${lastName}, ${firstInitial}.`;
}
