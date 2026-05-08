import { BedDouble, User, Calendar, Receipt } from 'lucide-react';
import { formatDate, formatCurrency } from '@utils/formatters';

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

export default function FoliosTable({ reservations, onRowClick }) {
    if (!reservations || reservations.length === 0) return null;

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
            <table className="w-full text-left text-sm text-[var(--color-text-secondary)]">
                <thead className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]">
                    <tr>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">Huésped</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap hidden sm:table-cell">Hab.</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap hidden md:table-cell">Control</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">Balance</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">Estado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                    {reservations.map((res, idx) => {
                        const colorData = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        const hasBalance = (res.balance || 0) > 0;

                        return (
                            <tr
                                key={res.id}
                                onClick={() => onRowClick(res)}
                                className="hover:bg-[var(--color-bg-tertiary)]/50 transition-colors group cursor-pointer"
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
                                            <div className="mt-1 flex flex-col gap-1 sm:hidden">
                                                <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                                                    <BedDouble className="h-3 w-3 shrink-0" />
                                                    <span>Hab. {res.room_number}</span>
                                                </div>
                                                {res.control_number && (
                                                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                                                        <Receipt className="h-3 w-3 shrink-0" />
                                                        <span>{res.control_number}</span>
                                                    </div>
                                                )}
                                                {res.check_in_date && (
                                                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                                                        <Calendar className="h-3 w-3 shrink-0" />
                                                        <span>{formatDate(res.check_in_date)} - {res.check_out_date ? formatDate(res.check_out_date) : 'N/A'}</span>
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
                                    <span className="font-mono text-xs text-[var(--color-text-muted)]">{res.control_number || '—'}</span>
                                </td>

                                <td className="px-4 py-3 align-middle">
                                    <span className={`text-xs font-bold ${hasBalance ? 'text-red-400' : 'text-emerald-400'}`}>
                                        {formatCurrency(res.balance || 0)}
                                    </span>
                                </td>

                                <td className="px-4 py-3 align-middle">
                                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                        hasBalance
                                            ? 'bg-amber-500/10 text-amber-400'
                                            : 'bg-emerald-500/10 text-emerald-400'
                                    }`}>
                                        {hasBalance ? 'Pendiente' : 'Pagado'}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
