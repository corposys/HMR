import { LogIn, LogOut, BedDouble, Calendar } from 'lucide-react';
import Button from '@shared/common/Button';
import { formatDate } from '@utils/formatters';
import { RESERVATION_STATUS_LABELS, RESERVATION_STATUS_COLORS } from '@utils/constants';

const AVATAR_COLORS = [
    { bg: '#009098', text: '#fff' },
    { bg: '#0f7681', text: '#fff' },
    { bg: '#1a5f7a', text: '#fff' },
    { bg: '#2d6a4f', text: '#fff' },
    { bg: '#6b4c9a', text: '#fff' },
    { bg: '#c75b39', text: '#fff' },
];

function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const VARIANT_CONFIG = {
    arrival: { actionIcon: LogIn, actionLabel: 'Check-in', actionVariant: 'primary' },
    departure: { actionIcon: LogOut, actionLabel: 'Check-out', actionVariant: 'danger' },
    inhouse: { actionIcon: null, actionLabel: null, actionVariant: null },
};

export default function CheckInOutTable({ reservations, variant, onAction }) {
    if (!reservations || reservations.length === 0) return null;

    const cfg = VARIANT_CONFIG[variant];

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
            <table className="w-full text-left text-sm text-[var(--color-text-secondary)]">
                <thead className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]">
                    <tr>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">Huésped</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap hidden sm:table-cell">Hab.</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap hidden md:table-cell">Entrada</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap hidden md:table-cell">Salida</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap hidden lg:table-cell">Plan</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">Estado</th>
                        <th scope="col" className="px-4 py-3 font-medium text-right whitespace-nowrap">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                    {reservations.map((res, idx) => {
                        const colorData = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        const statusColor = RESERVATION_STATUS_COLORS[res.status] || 'bg-gray-500/20 text-gray-400';

                        return (
                            <tr
                                key={res.id}
                                className="hover:bg-[var(--color-bg-tertiary)]/50 transition-colors group"
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-sm"
                                            style={{ background: colorData.bg, color: colorData.text }}
                                        >
                                            {getInitials(res.guest_name)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-[var(--color-text-primary)]">
                                                {res.guest_name}
                                            </p>
                                            {res.guest_document && (
                                                <p className="truncate text-xs text-[var(--color-text-muted)]">
                                                    {res.guest_document}
                                                </p>
                                            )}
                                            <div className="mt-1 flex flex-col gap-1 sm:hidden">
                                                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                                                    <BedDouble className="h-3 w-3 shrink-0" />
                                                    <span>Hab. {res.room_number}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                                                    <Calendar className="h-3 w-3 shrink-0" />
                                                    <span>{formatDate(res.check_in_date)} - {res.check_out_date ? formatDate(res.check_out_date) : 'N/A'}</span>
                                                </div>
                                                {res.plan_name && (
                                                    <div className="text-xs text-[var(--color-text-muted)]">
                                                        {res.plan_name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-4 py-3 hidden sm:table-cell align-middle">
                                    <span className="font-semibold text-[var(--color-text-primary)]">{res.room_number}</span>
                                </td>

                                <td className="px-4 py-3 hidden md:table-cell align-middle">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                                        <span>{formatDate(res.check_in_date)}</span>
                                    </div>
                                </td>

                                <td className="px-4 py-3 hidden md:table-cell align-middle">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                                        <span>{res.check_out_date ? formatDate(res.check_out_date) : 'N/A'}</span>
                                    </div>
                                </td>

                                <td className="px-4 py-3 hidden lg:table-cell align-middle text-xs">
                                    {res.plan_name || 'N/A'}
                                </td>

                                <td className="px-4 py-3 align-middle">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor}`}>
                                        {RESERVATION_STATUS_LABELS[res.status] || res.status}
                                    </span>
                                </td>

                                <td className="px-4 py-3 align-middle text-right">
                                    {cfg.actionLabel && onAction && (
                                        <Button
                                            variant={cfg.actionVariant}
                                            size="sm"
                                            icon={cfg.actionIcon}
                                            onClick={() => onAction(res.id || res)}
                                        >
                                            {cfg.actionLabel}
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
