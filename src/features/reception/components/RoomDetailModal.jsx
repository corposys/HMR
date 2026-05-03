import { useState } from 'react';
import { DoorOpen, Phone, Mail, UserCircle, FileText, X, ShieldCheck } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';
import { formatCurrency, formatDate } from '@utils/formatters';
import { RESERVATION_STATUS, RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS, HOUSEKEEPING_STATUS } from '@utils/constants';

export default function RoomDetailModal({ room, reservation, isOpen, onClose, onBlockRoom, onUpdateHousekeeping }) {
    const [housekeepingStatus, setHousekeepingStatus] = useState('');

    if (!room) return null;

    const handleHousekeepingChange = async (status) => {
        if (onUpdateHousekeeping) {
            await onUpdateHousekeeping(room.id, { housekeeping_status: status });
        }
    };

    function getRoomState(room) {
        if (room.is_blocked) return 'blocked';
        if (room.housekeeping_status === 'maintenance') return 'maintenance';
        if (reservation?.reservation_status === 'checked_in') return 'occupied';
        if (reservation?.reservation_status === 'reserved') return 'reserved';
        return 'available';
    }

    const state = getRoomState(room);
    const stateInfo = {
        available: { label: 'Disponible', color: 'success' },
        occupied: { label: 'Ocupada', color: 'primary' },
        reserved: { label: 'Reservada', color: 'warning' },
        blocked: { label: 'Bloqueada', color: 'danger' },
        maintenance: { label: 'Mantenimiento', color: 'warning' },
    }[state] || { label: state, color: 'primary' };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Habitación ${room.room_number}`} icon={DoorOpen} size="lg">
            <div className="space-y-5">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">{room.room_number}</h2>
                            <Badge variant={stateInfo.color}>{stateInfo.label}</Badge>
                        </div>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            {room.module_name} · Piso {room.floor_code} · {room.room_type_name}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-[var(--color-primary)]">{formatCurrency(room.nightly_rate_usd)}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">por noche</p>
                    </div>
                </div>

                {room.is_blocked && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-1">
                            <ShieldCheck className="w-4 h-4" />
                            Habitación bloqueada
                        </div>
                        {room.blocked_reason && <p className="text-sm text-[var(--color-text-secondary)]">{room.blocked_reason}</p>}
                        {room.blocked_until && <p className="text-xs text-[var(--color-text-muted)] mt-1">Hasta: {room.blocked_until}</p>}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Capacidad</p>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{room.max_occupancy || '-'} huéspedes</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Limpieza</p>
                        <div className="flex items-center gap-2">
                            <select
                                value={room.housekeeping_status || 'clean'}
                                onChange={(e) => handleHousekeepingChange(e.target.value)}
                                className="text-sm font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded px-2 py-1 focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                {Object.entries(HOUSEKEEPING_STATUS).map(([key, val]) => (
                                    <option key={key} value={key}>{val.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {(state === 'occupied' || state === 'reserved') && reservation && (
                    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/50">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Reserva #{reservation.id}</h3>
                            <Badge variant={RESERVATION_STATUS_COLORS[reservation.reservation_status] ? 'primary' : 'primary'}>
                                {RESERVATION_STATUS_LABELS[reservation.reservation_status] || reservation.reservation_status}
                            </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-[var(--color-text-muted)]">Huésped</p>
                                <p className="font-medium text-[var(--color-text-primary)] flex items-center gap-1">
                                    <UserCircle className="w-3.5 h-3.5" /> {reservation.guest_name}
                                </p>
                            </div>
                            <div>
                                <p className="text-[var(--color-text-muted)]">Documento</p>
                                <p className="text-[var(--color-text-secondary)]">{reservation.guest_document_type}-{reservation.guest_document_number}</p>
                            </div>
                            <div>
                                <p className="text-[var(--color-text-muted)]">Check-in</p>
                                <p className="text-[var(--color-text-secondary)]">{formatDate(reservation.reservation_check_in)}</p>
                            </div>
                            <div>
                                <p className="text-[var(--color-text-muted)]">Check-out</p>
                                <p className="text-[var(--color-text-secondary)]">{formatDate(reservation.reservation_check_out)}</p>
                            </div>
                            <div>
                                <p className="text-[var(--color-text-muted)]">Plan</p>
                                <p className="text-[var(--color-text-secondary)]">{reservation.plan_name || 'Sin plan'}</p>
                            </div>
                            <div>
                                <p className="text-[var(--color-text-muted)]">Folio</p>
                                <p className="text-[var(--color-text-secondary)]">
                                    {reservation.control_number || 'Sin folio'}
                                    {reservation.folio_balance > 0 && (
                                        <span className="text-[var(--color-warning)] ml-1">({formatCurrency(reservation.folio_balance)})</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {reservation.guest_phone && (
                            <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                <Phone className="w-3.5 h-3.5" /> {reservation.guest_phone}
                                {reservation.guest_email && (
                                    <>
                                        <span className="mx-2 text-[var(--color-text-muted)]">·</span>
                                        <Mail className="w-3.5 h-3.5" /> {reservation.guest_email}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {state === 'available' && (
                    <div className="flex items-center justify-center py-6 text-[var(--color-text-muted)]">
                        <div className="text-center">
                            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Habitación disponible</p>
                            <p className="text-xs mt-1">Sin reserva activa</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose} className="flex-1">Cerrar</Button>
                    <Button
                        variant={room.is_blocked ? 'primary' : 'danger'}
                        onClick={() => onBlockRoom?.(room)}
                    >
                        {room.is_blocked ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}