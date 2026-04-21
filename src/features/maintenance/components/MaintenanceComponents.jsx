import React from 'react';
import { Battery, Cog, User, Calendar, ChevronRight, Trash2 } from 'lucide-react';

export function HealthBar({ score }) {
    const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
            </div>
            <span className="text-xs font-medium text-[var(--color-text-muted)] w-8 text-right">{score}%</span>
        </div>
    );
}

export function TypeBadge({ type }) {
    const isBattery = type === 'battery';
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${isBattery
            ? 'bg-green-500/10 text-green-600 border-green-500/20'
            : 'bg-orange-500/10 text-orange-600 border-orange-500/20'
            }`}>
            {isBattery ? <Battery className="w-3 h-3" /> : <Cog className="w-3 h-3" />}
            {isBattery ? 'Batería' : 'Mecánico'}
        </span>
    );
}

export function LogRow({ log, onDelete, onViewRoom, formatDate }) {
    const isBattery = log.type === 'battery';

    return (
        <tr className="group border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
            {/* Type icon */}
            <td className="py-2 pl-3 pr-2 w-8">
                <div className={`p-1.5 rounded-md inline-flex ${isBattery ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                    {isBattery
                        ? <Battery className="w-3.5 h-3.5 text-green-500" />
                        : <Cog className="w-3.5 h-3.5 text-orange-500" />}
                </div>
            </td>
            {/* Room + badge */}
            <td className="py-2 px-2 whitespace-nowrap">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">Hab. {log.room_number}</span>
                    <TypeBadge type={log.type} />
                </div>
            </td>
            {/* Location */}
            <td className="py-2 px-2">
                <span className="text-xs text-[var(--color-text-muted)]">
                    {log.module_name}{log.floor_code ? ` · ${log.floor_code}` : ''}
                    {log.part_name ? <span className="text-[var(--color-text-secondary)]" > · {log.part_name}</span> : ''}
                </span>
            </td>
            {/* Description */}
            <td className="py-2 px-2 max-w-[220px]">
                {log.description
                    ? <span className="text-xs text-[var(--color-text-secondary)] truncate block" title={log.description}>{log.description}</span>
                    : <span className="text-xs text-[var(--color-text-muted)]">—</span>}
            </td>
            {/* Date */}
            <td className="py-2 px-2 whitespace-nowrap">
                <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                    <Calendar className="w-3 h-3 shrink-0" />{formatDate(log.performed_at)}
                </span>
            </td>
            {/* User */}
            <td className="py-2 px-2 whitespace-nowrap">
                {log.user_name
                    ? <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                        <User className="w-3 h-3 shrink-0" />{log.user_name}
                    </span>
                    : <span className="text-xs text-[var(--color-text-muted)]">—</span>}
            </td>
            {/* Actions */}
            <td className="py-2 pl-2 pr-3 w-16">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <button onClick={() => onViewRoom(log.room_id)} title="Ver habitación"
                        className="p-1.5 rounded-md hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] text-[var(--color-text-muted)] transition-colors">
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(log)} title="Eliminar"
                        className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 text-[var(--color-text-muted)] transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

