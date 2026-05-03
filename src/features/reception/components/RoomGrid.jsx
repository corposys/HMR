import { formatCurrency } from '@utils/formatters';
import { RESERVATION_STATUS, RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS, HOUSEKEEPING_STATUS } from '@utils/constants';
import { DoorOpen, Users, Clock, ShieldAlert, Eye } from 'lucide-react';

const ROOM_COLORS = {
    available: 'border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10',
    occupied: 'border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/15',
    reserved: 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10',
    blocked: 'border-red-500/40 bg-red-500/5',
    maintenance: 'border-orange-500/40 bg-orange-500/5',
};

const ROOM_DOT_COLORS = {
    available: 'bg-emerald-400',
    occupied: 'bg-blue-400',
    reserved: 'bg-amber-400',
    blocked: 'bg-red-400',
    maintenance: 'bg-orange-400',
};

function getRoomState(room) {
    if (room.is_blocked) return 'blocked';
    if (room.housekeeping_status === 'maintenance') return 'maintenance';
    if (room.reservation_status === 'checked_in') return 'occupied';
    if (room.reservation_status === 'reserved') return 'reserved';
    return 'available';
}

export function RoomCard({ room, onClick }) {
    const state = getRoomState(room);
    const statusLabel = {
        available: 'Disponible',
        occupied: 'Ocupada',
        reserved: 'Reservada',
        blocked: 'Bloqueada',
        maintenance: 'Mantenimiento',
    }[state];

    return (
        <button
            onClick={() => onClick?.(room)}
            className={`group relative rounded-xl border-2 p-3 transition-all duration-200 text-left w-full ${ROOM_COLORS[state]} ${room.is_blocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
        >
            <div className="flex items-start justify-between mb-2">
                <span className="text-lg font-bold text-[var(--color-text-primary)]">{room.room_number}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${ROOM_DOT_COLORS[state]} shrink-0 mt-1`} />
            </div>

            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium mb-1">
                {room.room_type_name || 'Sin tipo'}
            </p>

            <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
                {formatCurrency(room.nightly_rate_usd)}<span className="text-[10px] text-[var(--color-text-muted)] font-normal">/noche</span>
            </p>

            {state === 'occupied' && room.guest_name && (
                <div className="mt-2 flex items-center gap-1 text-xs text-blue-400">
                    <Users className="w-3 h-3" />
                    <span className="truncate">{room.guest_name}</span>
                </div>
            )}

            {state === 'reserved' && room.guest_name && (
                <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
                    <Clock className="w-3 h-3" />
                    <span className="truncate">{room.guest_name}</span>
                </div>
            )}

            {state === 'blocked' && room.blocked_reason && (
                <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
                    <ShieldAlert className="w-3 h-3" />
                    <span className="truncate">{room.blocked_reason}</span>
                </div>
            )}

            {state === 'maintenance' && (
                <div className="mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium">
                        Mantenimiento
                    </span>
                </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-xl backdrop-blur-[1px]">
                <Eye className="w-5 h-5 text-[var(--color-text-primary)]" />
            </div>
        </button>
    );
}

function RoomTableRow({ room, onClick }) {
    const state = getRoomState(room);

    return (
        <tr
            onClick={() => onClick?.(room)}
            className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)] cursor-pointer transition-colors"
        >
            <td className="px-4 py-3 text-sm font-medium text-[var(--color-text-primary)]">{room.room_number}</td>
            <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">{room.room_type_name || '-'}</td>
            <td className="px-4 py-3 text-sm">{formatCurrency(room.nightly_rate_usd)}</td>
            <td className="px-4 py-3 text-sm">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${ROOM_DOT_COLORS[state]} bg-opacity-20`}
                    style={{ backgroundColor: 'transparent' }}
                >
                    <span className={`w-1.5 h-1.5 rounded-full ${ROOM_DOT_COLORS[state]}`} />
                    {statusLabel}
                </span>
            </td>
            <td className="px-4 py-3 text-sm">
                {state === 'occupied' || state === 'reserved' ? room.guest_name : '-'}
            </td>
            <td className="px-4 py-3 text-sm">
                {room.housekeeping_status ? (HOUSEKEEPING_STATUS[room.housekeeping_status]?.label || room.housekeeping_status) : '-'}
            </td>
        </tr>
    );
}

export function RoomGrid({ rooms, onRoomClick, viewMode = 'grid' }) {
    if (!rooms || rooms.length === 0) {
        return (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
                <DoorOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No se encontraron habitaciones</p>
            </div>
        );
    }

    if (viewMode === 'table') {
        return (
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)]">
                            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Habitación</th>
                            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Tipo</th>
                            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Tarifa</th>
                            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Estado</th>
                            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Huésped</th>
                            <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider">Limpieza</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rooms.map((room) => (
                            <RoomTableRow key={room.id} room={room} onClick={onRoomClick} />
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    const grouped = {};
    rooms.forEach((room) => {
        const key = room.module_name || `Módulo ${room.module_number}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(room);
    });

    return (
        <div className="space-y-6">
            {Object.entries(grouped).map(([moduleName, moduleRooms]) => (
                <div key={moduleName}>
                    <h3 className="text-sm font-medium text-[var(--color-text-muted)] mb-3 uppercase tracking-wider">
                        {moduleName}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {moduleRooms.map((room) => (
                            <RoomCard key={room.id} room={room} onClick={onRoomClick} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}