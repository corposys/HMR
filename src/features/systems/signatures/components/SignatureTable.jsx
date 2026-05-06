import React from 'react';
import { Mail, Smartphone, Edit3, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@utils/formatters';

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

export default function SignatureTable({ signatures, onEdit, onDelete }) {
    if (!signatures || signatures.length === 0) return null;

    return (
        <div className="w-full overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
            <table className="w-full text-left text-sm text-[var(--color-text-secondary)]">
                <thead className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]">
                    <tr>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">Empleado</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap hidden sm:table-cell">Contacto</th>
                        <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap hidden md:table-cell">Fecha</th>
                        <th scope="col" className="px-4 py-3 font-medium text-right whitespace-nowrap">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                    {signatures.map((sig, idx) => {
                        const colorData = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                        const hasMobilePhone = Boolean(sig.mobile_phone);

                        return (
                            <tr key={sig.id} className="hover:bg-[var(--color-bg-tertiary)]/50 transition-colors group">
                                {/* COLUMNA: EMPLEADO */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold shadow-sm"
                                            style={{ background: colorData.bg, color: colorData.text }}
                                        >
                                            {getInitials(sig.full_name)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-medium text-[var(--color-text-primary)]">
                                                {sig.full_name}
                                            </p>
                                            <p className="truncate text-xs text-[var(--color-text-muted)]">
                                                {sig.job_title}
                                            </p>
                                            {/* Vista móvil para contacto/fecha que se oculta en sm/md */}
                                            <div className="mt-1 flex flex-col gap-1 sm:hidden">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <Mail className="h-3 w-3 shrink-0" />
                                                    <span className="truncate">{sig.email}</span>
                                                </div>
                                                {hasMobilePhone && (
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <Smartphone className="h-3 w-3 shrink-0" />
                                                        <span>{sig.mobile_phone}</span>
                                                    </div>
                                                )}
                                                <div className="text-[11px] mt-1 text-[var(--color-text-muted)]">
                                                    {formatDate(sig.created_at)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* COLUMNA: CONTACTO (Oculta en móvil) */}
                                <td className="px-4 py-3 hidden sm:table-cell align-middle">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                                            <span className="truncate">{sig.email}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Smartphone className={`h-3.5 w-3.5 shrink-0 ${hasMobilePhone ? 'text-[var(--color-text-muted)]' : 'text-[var(--color-text-muted)]/50'}`} />
                                            <span className={hasMobilePhone ? '' : 'text-[var(--color-text-muted)]/50 italic'}>
                                                {hasMobilePhone ? sig.mobile_phone : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </td>

                                {/* COLUMNA: FECHA (Oculta en tablet/móvil) */}
                                <td className="px-4 py-3 hidden md:table-cell align-middle">
                                    <Badge variant="outline" className="text-[11px] font-medium border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                                        {formatDate(sig.created_at)}
                                    </Badge>
                                </td>

                                {/* COLUMNA: ACCIONES */}
                                <td className="px-4 py-3 align-middle text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(sig)}
                                            className="inline-flex items-center justify-center rounded-md border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-1.5 text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
                                            aria-label="Editar firma"
                                            title="Editar firma"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(sig)}
                                            className="inline-flex items-center justify-center rounded-md border border-red-500/20 bg-red-500/10 p-1.5 text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300"
                                            aria-label="Eliminar firma"
                                            title="Eliminar firma"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
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