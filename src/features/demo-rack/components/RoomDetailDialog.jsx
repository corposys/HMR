import { BedDouble, User, Calendar, Users, DollarSign } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const statusConfig = {
    disponible: { label: 'Disponible', className: 'bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/30' },
    ocupada: { label: 'Ocupada', className: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)] border-[var(--color-danger)]/30' },
    limpieza: { label: 'Limpieza', className: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-[var(--color-warning)]/30' },
    mantenimiento: { label: 'Mantenimiento', className: 'bg-[var(--color-text-muted)]/15 text-[var(--color-text-muted)] border-[var(--color-text-muted)]/30' },
};

export default function RoomDetailDialog({ room, onClose }) {
    const open = !!room;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
            <DialogContent className="bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <BedDouble className="w-5 h-5 text-[var(--color-primary)]" />
                        Habitación {room?.number}
                    </DialogTitle>
                    <DialogDescription className="text-[var(--color-text-muted)]">
                        Detalle de la habitación
                    </DialogDescription>
                </DialogHeader>

                {room && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`${statusConfig[room.status].className}`}>
                                {statusConfig[room.status].label}
                            </Badge>
                            <span className="text-sm text-[var(--color-text-secondary)]">{room.type}</span>
                        </div>

                        <Separator className="bg-[var(--color-border)]" />

                        <div className="grid grid-cols-2 gap-3">
                            <InfoItem icon={DollarSign} label="Precio" value={`$${room.price}/noche`} />
                            <InfoItem icon={Calendar} label="Piso" value={`Piso ${room.floor}`} />
                        </div>

                        {room.guest && (
                            <>
                                <Separator className="bg-[var(--color-border)]" />
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Información del huésped</p>
                                    <InfoItem icon={User} label="Nombre" value={room.guest.name} />
                                    <InfoItem icon={Calendar} label="Check-in" value={room.guest.checkIn} />
                                    <InfoItem icon={Calendar} label="Check-out" value={room.guest.checkOut} />
                                    <InfoItem icon={Users} label="Ocupación" value={`${room.guest.adults} adultos${room.guest.children ? `, ${room.guest.children} niños` : ''}`} />
                                </div>
                            </>
                        )}
                    </div>
                )}
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
