import {
    BedDouble, User, Calendar,
    DollarSign, Tag, ArrowRight, LogIn, LogOut, Receipt, ShieldAlert,
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getRackState, RACK_STATE_LABELS, formatCurrency, formatShortDate } from '../utils/rackHelpers';

const stateBadgeConfig = {
    available: { label: 'Disponible', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    occupied: { label: 'Ocupada', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    reserved: { label: 'Reservada', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    dirty: { label: 'Sucia', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
    maintenance: { label: 'Mantenimiento', className: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
    blocked: { label: 'Bloqueada', className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
    fdu: { label: 'FDU', className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
};

export default function RackRoomDialog({ room, isOpen, onClose }) {
    if (!room) return null;

    const state = getRackState(room);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] max-w-sm sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <BedDouble className="w-5 h-5 text-[var(--color-primary)]" />
                        Habitación {room.room_number}
                    </DialogTitle>
                    <DialogDescription className="text-[var(--color-text-muted)]">
                        Detalle de la habitación
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`${stateBadgeConfig[state].className}`}>
                            {stateBadgeConfig[state].label}
                        </Badge>
                        {room.room_type_name && (
                            <span className="text-sm text-[var(--color-text-secondary)]">
                                {room.room_type_name} · {room.max_occupancy} pax
                            </span>
                        )}
                    </div>

                    <Separator className="bg-[var(--color-border)]" />

                    <div className="grid grid-cols-2 gap-3">
                        <InfoItem icon={DollarSign} label="Tarifa" value={formatCurrency(room.nightly_rate_usd) + '/noche'} />
                        <InfoItem icon={Calendar} label="Piso" value={room.floor_code} />
                    </div>

                    {room.guest_name && (
                        <>
                            <Separator className="bg-[var(--color-border)]" />
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">Información del huésped</p>
                                <InfoItem icon={User} label="Nombre" value={room.guest_name} />
                                {room.plan_name && <InfoItem icon={Tag} label="Plan" value={room.plan_name} />}
                                {room.reservation_check_in && (
                                    <InfoItem icon={Calendar} label="Estadía" value={`${formatShortDate(room.reservation_check_in)} → ${formatShortDate(room.reservation_check_out)}`} />
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
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
                                            Check-out
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
                        </>
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
            </DialogContent>
        </Dialog>
    );
}

function InfoItem({ icon, label, value }) {
    const IconComponent = icon;
    return (
        <div className="flex items-start gap-2">
            <IconComponent className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
            <div>
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">{label}</p>
                <p className="text-sm text-[var(--color-text-primary)] font-medium">{value}</p>
            </div>
        </div>
    );
}
