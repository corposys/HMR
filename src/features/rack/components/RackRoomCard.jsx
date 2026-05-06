import { getRackState, getStateColors, RACK_STATE_LABELS, getGuestShortName, formatCurrency } from '../utils/rackHelpers';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function RackRoomCard({ room, onClick }) {
    const state = getRackState(room);
    const label = RACK_STATE_LABELS[state];
    const colors = getStateColors(state);

    const tooltipLines = [
        `Hab. ${room.room_number} — ${label}`,
        room.room_type_name,
        room.guest_name ? `Huésped: ${room.guest_name}` : null,
        room.plan_name ? `Plan: ${room.plan_name}` : null,
        room.reservation_check_in
            ? `Fechas: ${room.reservation_check_in} → ${room.reservation_check_out}`
            : null,
        room.nightly_rate_usd ? `Tarifa: ${formatCurrency(room.nightly_rate_usd)}/noche` : null,
        room.is_blocked && room.blocked_reason ? `Motivo: ${room.blocked_reason}` : null,
    ].filter(Boolean);

    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Card
                        onClick={() => onClick(room)}
                        className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg bg-[var(--color-bg-secondary)] border ${colors.border} ${colors.hover}`}
                    >
                        <CardContent className="p-3 flex flex-col items-center gap-1.5">
                            <div className="flex items-center justify-between w-full">
                                <span className="text-lg font-bold text-[var(--color-text-primary)]">
                                    {room.room_number}
                                </span>
                                <Badge variant="outline" className={`text-[9px] px-1 py-0 font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
                                    {label}
                                </Badge>
                            </div>

                            <span className="text-[10px] text-[var(--color-text-muted)] truncate max-w-full">
                                {room.room_type_name}
                            </span>

                            {room.guest_name && (
                                <span className="text-[10px] text-[var(--color-text-secondary)] truncate max-w-full">
                                    {getGuestShortName(room.guest_name)}
                                </span>
                            )}
                        </CardContent>
                    </Card>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border-[var(--color-border)] max-w-xs">
                    {tooltipLines.map((line, i) => (
                        <p key={i} className="text-xs">{line}</p>
                    ))}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
