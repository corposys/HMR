import React from 'react';
import { DoorOpen, MapPin, Battery, ShieldAlert, AlertCircle, ArrowUpRight } from 'lucide-react';
import { LOCK_STATUS_LABELS, LOCK_STATUS_DOT_STYLES } from '../utils/lockConstants';
import { formatShortDate } from '../utils/lockHelpers';

export default function LocksTable({ locks, onOpen, onOpenDetail }) {
    if (!locks || locks.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 text-[var(--color-text-muted)]">
                <div className="text-center">
                    <p className="text-lg font-medium">No hay cerraduras para mostrar con los filtros actuales.</p>
                    <p className="text-sm mt-1">Ajusta los filtros para ver resultados.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium text-xs uppercase tracking-wider">
                        <th className="py-3 px-4">Habitación</th>
                        <th className="py-3 px-4">Módulo</th>
                        <th className="py-3 px-4">Piso</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Batería</th>
                        <th className="py-3 px-4">Últ. Mant.</th>
                        <th className="py-3 px-4 text-center">Eventos</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                    {locks.map((item) => {
                        const statusKey = item.status || 'operational';
                        const statusDotClass = LOCK_STATUS_DOT_STYLES[statusKey] || LOCK_STATUS_DOT_STYLES.operational;
                        const healthScore = item.prediction?.health_score ?? null;
                        const batteryColor = healthScore === null ? 'bg-zinc-600'
                            : healthScore > 60 ? 'bg-emerald-500'
                                : healthScore > 30 ? 'bg-amber-400'
                                    : 'bg-red-500';
                        const daysColor = !item.prediction ? 'text-[var(--color-text-muted)]'
                            : item.prediction.days_remaining <= 0 ? 'text-red-400'
                                : item.prediction.days_remaining <= 15 ? 'text-amber-400'
                                    : 'text-emerald-400';

                        return (
                            <tr
                                key={item.id}
                                className="hover:bg-[var(--color-bg-primary)]/50 transition-colors cursor-pointer"
                                onClick={() => onOpen(item)}
                            >
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <DoorOpen className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                                        <span className="font-bold text-[var(--color-text-primary)]">{item.room_number}</span>
                                        {item.notes && (
                                            <span className="text-[10px] text-amber-400" title={item.notes}>●</span>
                                        )}
                                        {item.has_active_report && (
                                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/10 text-amber-400" title="Reporte de falla activo">
                                                <AlertCircle className="w-2.5 h-2.5" />
                                                Reporte
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-4 text-[var(--color-text-secondary)] text-xs">
                                    {item.module_name || '—'}
                                </td>
                                <td className="py-3 px-4 text-[var(--color-text-secondary)] text-xs">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-[var(--color-text-muted)]" />
                                        {item.floor_code || '—'}
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
                                        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                                            {LOCK_STATUS_LABELS[statusKey] || LOCK_STATUS_LABELS.operational}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-4">
                                    {healthScore !== null ? (
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-16 rounded-full bg-[var(--color-border)] overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${batteryColor}`}
                                                    style={{ width: `${healthScore}%` }}
                                                />
                                            </div>
                                            <span className={`text-xs font-semibold ${daysColor}`}>
                                                {item.prediction.days_remaining <= 0
                                                    ? `${Math.abs(item.prediction.days_remaining)}d`
                                                    : `${item.prediction.days_remaining}d`}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-[var(--color-text-muted)]">Sin datos</span>
                                    )}
                                </td>
                                <td className="py-3 px-4 text-[var(--color-text-secondary)] text-xs">
                                    {formatShortDate(item.last_maintenance_at)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                                        <AlertCircle className="w-3 h-3 text-[var(--color-text-muted)]" />
                                        {item.events_count || 0}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-right">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenDetail(item.room_id || item.id);
                                        }}
                                        className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors font-medium"
                                    >
                                        <ArrowUpRight className="w-3 h-3" />
                                        Ver
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
