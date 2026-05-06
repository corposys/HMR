import {
    BedDouble, User, Calendar, Tag, DollarSign, ShieldAlert,
    StickyNote, Users, Clock, ArrowRight,
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

function InfoItem({ icon, label, value, tone = 'text-[var(--color-text-primary)]' }) {
    const IconComponent = icon;
    return (
        <div className="flex items-start gap-2">
            <IconComponent className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5 shrink-0" />
            <div>
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">{label}</p>
                <p className={`text-sm font-medium ${tone}`}>{value}</p>
            </div>
        </div>
    );
}

function SectionBox({ children, className = '' }) {
    return (
        <div className={`rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-bg-primary)]/30 p-3 ${className}`}>
            {children}
        </div>
    );
}

export default function RackRoomDialog({ room, isOpen, onClose }) {
    if (!room) return null;

    const state = getRackState(room);
    const config = stateBadgeConfig[state];

    const hasReservation = Boolean(room.active_reservation_id);
    const hasGuest = Boolean(room.guest_name);
    const hasBlockedReason = Boolean(room.blocked_reason);

    const nights = room.reservation_check_in && room.reservation_check_out
        ? Math.ceil((new Date(room.reservation_check_out) - new Date(room.reservation_check_in)) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] max-w-md">
                <DialogHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <BedDouble className="w-5 h-5 text-[var(--color-primary)]" />
                            Habitación {room.room_number}
                        </DialogTitle>
                        <Badge variant="outline" className={`text-xs ${config.className}`}>
                            {config.label}
                        </Badge>
                    </div>
                    <DialogDescription className="text-[var(--color-text-muted)]">
                        {room.room_type_name} · {room.max_occupancy} pax
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="habitacion" className="w-full">
                    <TabsList className="w-full bg-[var(--color-bg-primary)]/50 border border-[var(--color-border)]/60">
                        <TabsTrigger value="habitacion" className="text-xs flex-1 data-[state=active]:bg-[var(--color-bg-secondary)] data-[state=active]:text-[var(--color-text-primary)]">
                            Habitación
                        </TabsTrigger>
                        {hasGuest && (
                            <TabsTrigger value="huesped" className="text-xs flex-1 data-[state=active]:bg-[var(--color-bg-secondary)] data-[state=active]:text-[var(--color-text-primary)]">
                                Huésped
                            </TabsTrigger>
                        )}
                        {hasReservation && (
                            <TabsTrigger value="fechas" className="text-xs flex-1 data-[state=active]:bg-[var(--color-bg-secondary)] data-[state=active]:text-[var(--color-text-primary)]">
                                Fechas
                            </TabsTrigger>
                        )}
                        {hasBlockedReason && (
                            <TabsTrigger value="notas" className="text-xs flex-1 data-[state=active]:bg-[var(--color-bg-secondary)] data-[state=active]:text-[var(--color-text-primary)]">
                                Notas
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="habitacion" className="mt-3 space-y-3">
                        <SectionBox>
                            <div className="grid grid-cols-2 gap-3">
                                <InfoItem icon={BedDouble} label="Número" value={room.room_number} />
                                <InfoItem icon={Tag} label="Tipo" value={room.room_type_name || '—'} />
                                <InfoItem icon={DollarSign} label="Tarifa" value={formatCurrency(room.nightly_rate_usd) + '/noche'} />
                                <InfoItem icon={Users} label="Capacidad" value={`${room.max_occupancy} personas`} />
                            </div>
                        </SectionBox>

                        <SectionBox>
                            <InfoItem icon={ShieldAlert} label="Estado" value={config.label} tone={config.className.split(' ')[1]} />
                        </SectionBox>

                        {room.category && (
                            <SectionBox>
                                <InfoItem icon={StickyNote} label="Categoría" value={room.category} />
                            </SectionBox>
                        )}
                    </TabsContent>

                    {hasGuest && (
                        <TabsContent value="huesped" className="mt-3 space-y-3">
                            <SectionBox>
                                <InfoItem icon={User} label="Nombre completo" value={room.guest_name} />
                            </SectionBox>

                            {room.plan_name && (
                                <SectionBox>
                                    <InfoItem icon={Tag} label="Plan" value={room.plan_name} />
                                </SectionBox>
                            )}

                            {room.active_reservation_id && (
                                <SectionBox>
                                    <InfoItem icon={StickyNote} label="ID Reservación" value={`#${room.active_reservation_id}`} />
                                </SectionBox>
                            )}
                        </TabsContent>
                    )}

                    {hasReservation && (
                        <TabsContent value="fechas" className="mt-3 space-y-3">
                            <SectionBox>
                                <div className="grid grid-cols-2 gap-3">
                                    <InfoItem icon={Calendar} label="Entrada" value={formatShortDate(room.reservation_check_in)} />
                                    <InfoItem icon={Calendar} label="Salida" value={formatShortDate(room.reservation_check_out)} />
                                </div>
                            </SectionBox>

                            {nights !== null && (
                                <SectionBox>
                                    <InfoItem icon={Clock} label="Noches" value={`${nights} ${nights === 1 ? 'noche' : 'noches'}`} />
                                </SectionBox>
                            )}

                            <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                                <ArrowRight className="w-3 h-3" />
                                <span>Estadía: {formatShortDate(room.reservation_check_in)} → {formatShortDate(room.reservation_check_out)}</span>
                            </div>
                        </TabsContent>
                    )}

                    {hasBlockedReason && (
                        <TabsContent value="notas" className="mt-3 space-y-3">
                            <SectionBox className="border-red-500/20 bg-red-500/5">
                                <div className="flex items-start gap-2">
                                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wide">Motivo</p>
                                        <p className="text-sm font-medium text-red-400">{room.blocked_reason}</p>
                                    </div>
                                </div>
                            </SectionBox>

                            {room.blocked_until && (
                                <SectionBox>
                                    <InfoItem icon={Calendar} label="Bloqueada hasta" value={formatShortDate(room.blocked_until)} />
                                </SectionBox>
                            )}
                        </TabsContent>
                    )}
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
