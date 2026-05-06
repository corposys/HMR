import { User, BedDouble, ArrowRightLeft, Wrench, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const statusConfig = {
    disponible: {
        label: 'Disponible',
        icon: BedDouble,
        className: 'bg-[var(--color-success)]/15 text-[var(--color-success)] border-[var(--color-success)]/30 hover:bg-[var(--color-success)]/25',
        cardBorder: 'border-[var(--color-success)]/20 hover:border-[var(--color-success)]/50',
    },
    ocupada: {
        label: 'Ocupada',
        icon: User,
        className: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)] border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/25',
        cardBorder: 'border-[var(--color-danger)]/20 hover:border-[var(--color-danger)]/50',
    },
    limpieza: {
        label: 'Limpieza',
        icon: Sparkles,
        className: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-[var(--color-warning)]/30 hover:bg-[var(--color-warning)]/25',
        cardBorder: 'border-[var(--color-warning)]/20 hover:border-[var(--color-warning)]/50',
    },
    mantenimiento: {
        label: 'Mantenimiento',
        icon: Wrench,
        className: 'bg-[var(--color-text-muted)]/15 text-[var(--color-text-muted)] border-[var(--color-text-muted)]/30 hover:bg-[var(--color-text-muted)]/25',
        cardBorder: 'border-[var(--color-text-muted)]/20 hover:border-[var(--color-text-muted)]/50',
    },
};

export default function RoomCard({ room, onClick }) {
    const config = statusConfig[room.status];
    const StatusIcon = config.icon;

    const tooltipContent = room.guest
        ? `${room.guest.name} · Salida: ${room.guest.checkOut}`
        : `${room.type} · $${room.price}/noche`;

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card
                        onClick={onClick}
                        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg bg-[var(--color-bg-secondary)] ${config.cardBorder}`}
                    >
                        <CardContent className="p-3 flex flex-col items-center gap-2">
                            <div className="flex items-center justify-between w-full">
                                <span className="text-lg font-bold text-[var(--color-text-primary)]">
                                    {room.number}
                                </span>
                                <StatusIcon className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                            </div>

                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium ${config.className}`}>
                                {config.label}
                            </Badge>

                            <span className="text-[10px] text-[var(--color-text-muted)]">
                                {room.type}
                            </span>
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border-[var(--color-border)]">
                    <p className="text-xs">{tooltipContent}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
