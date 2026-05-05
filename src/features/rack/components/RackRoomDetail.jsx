import { useState } from 'react';
import {
    BedDouble,
    User,
    Calendar,
    Ban,
    Wrench,
    CheckCircle,
    AlertTriangle,
    Clock,
    X,
    DollarSign,
    Tag,
    ArrowRight,
    LogIn,
    LogOut,
    Receipt,
    ShieldAlert,
} from 'lucide-react';
import Badge from '@shared/common/Badge';
import Button from '@shared/common/Button';
import { getRackState, RACK_STATE_LABELS, formatCurrency, formatShortDate } from '../utils/rackHelpers';
import { apiJson } from '@utils/api';
import { usePermissions } from '@hooks/usePermissions';

export default function RackRoomDetail({ room, isOpen, onClose, onUpdated, isMobile }) {
    const { can } = usePermissions();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!room) return null;

    const state = getRackState(room);
    const stateLabel = RACK_STATE_LABELS[state] || 'Desconocido';

    const handleUpdateHousekeeping = async (status) => {
        setLoading(true);
        setError(null);
        try {
            await apiJson(`/api/reception/rooms/${room.id}`, {
                method: 'PATCH',
                body: { housekeeping_status: status },
            });
            onUpdated();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async () => {
        setLoading(true);
        setError(null);
        try {
            await apiJson(`/api/reception/rooms/${room.id}`, {
                method: 'PATCH',
                body: {
                    is_blocked: !room.is_blocked,
                    blocked_reason: room.is_blocked ? null : 'Bloqueada desde rack',
                },
            });
            onUpdated();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getBadgeVariant = () => {
        switch (state) {
            case 'available': return 'success';
            case 'occupied': return 'danger';
            case 'reserved': return 'primary';
            case 'dirty': return 'warning';
            case 'maintenance': return 'info';
            case 'blocked': return 'info';
            case 'fdu': return 'info';
            default: return 'info';
        }
    };

    const canWrite = can('rooms', 'write');

    const content = (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getBadgeVariant()}>{stateLabel}</Badge>
                        {room.room_type_name && (
                            <span className="text-xs text-[var(--color-text-muted)]">
                                {room.room_type_name} · {room.max_occupancy} pax
                            </span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                        Habitación {room.room_number}
                    </h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Guest info */}
            {room.guest_name && (
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 space-y-2.5">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                        <User className="w-4 h-4 text-[var(--color-text-muted)]" />
                        {room.guest_name}
                    </div>
                    {room.plan_name && (
                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                            <Tag className="w-3.5 h-3.5" />
                            {room.plan_name}
                        </div>
                    )}
                    {room.reservation_check_in && (
                        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatShortDate(room.reservation_check_in)} → {formatShortDate(room.reservation_check_out)}
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatCurrency(room.nightly_rate_usd)}/noche
                    </div>

                    {/* Navigation links */}
                    <div className="pt-1 border-t border-[var(--color-border)]/50 flex flex-wrap gap-2">
                        {state === 'reserved' && (
                            <a
                                href={`/reception/checkin?reservation=${room.reservation_id}`}
                                className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                            >
                                <LogIn className="w-3 h-3" />
                                Ir a Check-in
                                <ArrowRight className="w-3 h-3" />
                            </a>
                        )}
                        {state === 'occupied' && (
                            <>
                                <a
                                    href={`/reception/checkout?room=${room.room_number}&reservation=${room.reservation_id}`}
                                    className="inline-flex items-center gap-1 text-xs text-red-400 hover:underline"
                                >
                                    <LogOut className="w-3 h-3" />
                                    Ir a Check-out
                                    <ArrowRight className="w-3 h-3" />
                                </a>
                                <a
                                    href={`/reception/folios?reservation=${room.reservation_id}`}
                                    className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                                >
                                    <Receipt className="w-3 h-3" />
                                    Ver Folio
                                    <ArrowRight className="w-3 h-3" />
                                </a>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Empty room info */}
            {!room.guest_name && (
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                        <DollarSign className="w-3.5 h-3.5" />
                        {formatCurrency(room.nightly_rate_usd)}/noche
                    </div>
                    {room.max_occupancy && (
                        <div className="text-xs text-[var(--color-text-muted)]">
                            Capacidad: {room.max_occupancy} personas
                        </div>
                    )}
                </div>
            )}

            {/* Quick actions */}
            {canWrite && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                        Acciones rápidas
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={CheckCircle}
                            loading={loading}
                            onClick={() => handleUpdateHousekeeping('clean')}
                            disabled={room.housekeeping_status === 'clean'}
                        >
                            Marcar limpia
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={AlertTriangle}
                            loading={loading}
                            onClick={() => handleUpdateHousekeeping('dirty')}
                            disabled={room.housekeeping_status === 'dirty'}
                        >
                            Marcar sucia
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            icon={Wrench}
                            loading={loading}
                            onClick={() => handleUpdateHousekeeping('maintenance')}
                            disabled={room.housekeeping_status === 'maintenance'}
                        >
                            Mantenimiento
                        </Button>
                        <Button
                            variant={room.is_blocked ? 'ghost' : 'danger'}
                            size="sm"
                            icon={Ban}
                            loading={loading}
                            onClick={handleToggleBlock}
                        >
                            {room.is_blocked ? 'Desbloquear' : 'Bloquear'}
                        </Button>
                    </div>
                </div>
            )}

            {room.blocked_reason && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-medium text-red-400">Bloqueada</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{room.blocked_reason}</p>
                    </div>
                </div>
            )}
        </div>
    );

    // Mobile: full-screen overlay / bottom sheet style
    if (isMobile) {
        return (
            <div
                className={`fixed inset-0 z-50 flex items-end transition-opacity duration-200 ${
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
            >
                <div className="absolute inset-0 bg-black/50" onClick={onClose} />
                <div
                    className={`relative w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[var(--color-bg-primary)] border-t border-[var(--color-border)] p-4 transition-transform duration-300 ${
                        isOpen ? 'translate-y-0' : 'translate-y-full'
                    }`}
                >
                    {/* Drag handle */}
                    <div className="flex justify-center mb-3">
                        <div className="w-10 h-1 rounded-full bg-[var(--color-border)]" />
                    </div>
                    {content}
                </div>
            </div>
        );
    }

    // Desktop: side panel
    return (
        <div
            className={`fixed right-0 top-0 bottom-0 z-40 w-80 bg-[var(--color-bg-primary)] border-l border-[var(--color-border)] overflow-y-auto transition-transform duration-300 ease-out ${
                isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{ paddingTop: '4rem' }}
        >
            <div className="p-4">
                {content}
            </div>
        </div>
    );
}
