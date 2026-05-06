import React from 'react';
import { Eye, XCircle, BedDouble, Calendar, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatCurrency } from '@utils/formatters';
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

export default function ReservationTable({ reservations, onRowClick, onCancel }) {
    if (!reservations || reservations.length === 0) return null;

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
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap hidden lg:table-cell text-right">Balance</th>
                        <th scope="col" className="px-4 py-3 font-medium text-right whitespace-nowrap">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                    {reservations.map((res, idx) => {
                        const colorData = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        const statusColor = RESERVATION_STATUS_COLORS[res.status] || 'bg-gray-500/20 text-gray-400';
                        const hasBalance = res.folio_balance != null;
                        const isPositive = hasBalance && Number(res.folio_balance) > 0;

                        return (
                            <tr
                                key={res.id}
                                onClick={() => onRowClick?.(res)}
                                className="hover:bg-[var(--color-bg-tertiary)]/50 transition-colors group cursor-pointer"
                            >
                                {/* COLUMNA: HUÉSPED */}
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
                                            {/* Vista móvil: datos colapsados */}
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
                                                {hasBalance && (
                                                    <div className={`text-xs font-medium ${isPositive ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                                                        {formatCurrency(res.folio_balance)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* COLUMNA: HABITACIÓN */}
                                <td className="px-4 py-3 hidden sm:table-cell align-middle">
                                    <span className="font-semibold text-[var(--color-text-primary)]">{res.room_number}</span>
                                </td>

                                {/* COLUMNA: ENTRADA */}
                                <td className="px-4 py-3 hidden md:table-cell align-middle">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                                        <span>{formatDate(res.check_in_date)}</span>
                                    </div>
                                </td>

                                {/* COLUMNA: SALIDA */}
                                <td className="px-4 py-3 hidden md:table-cell align-middle">
                                    <div className="flex items-center gap-1.5 text-xs">
                                        <Calendar className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                                        <span>{res.check_out_date ? formatDate(res.check_out_date) : 'N/A'}</span>
                                    </div>
                                </td>

                                {/* COLUMNA: PLAN */}
                                <td className="px-4 py-3 hidden lg:table-cell align-middle text-xs">
                                    {res.plan_name || 'N/A'}
                                </td>

                                {/* COLUMNA: ESTADO */}
                                <td className="px-4 py-3 align-middle">
                                    <Badge className={`text-[11px] font-medium border-0 ${statusColor}`}>
                                        {RESERVATION_STATUS_LABELS[res.status] || res.status}
                                    </Badge>
                                </td>

                                {/* COLUMNA: BALANCE */}
                                <td className="px-4 py-3 hidden lg:table-cell align-middle text-right">
                                    {hasBalance ? (
                                        <span className={`text-xs font-medium ${isPositive ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                                            {formatCurrency(res.folio_balance)}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-[var(--color-text-muted)]">N/A</span>
                                    )}
                                </td>

                                {/* COLUMNA: ACCIONES */}
                                <td className="px-4 py-3 align-middle text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onRowClick?.(res); }}
                                            className="inline-flex items-center justify-center rounded-md border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-1.5 text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
                                            aria-label="Ver detalle"
                                            title="Ver detalle"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                        {res.status === 'reserved' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onCancel?.(res); }}
                                                className="inline-flex items-center justify-center rounded-md border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300"
                                                aria-label="Cancelar reserva"
                                                title="Cancelar reserva"
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
