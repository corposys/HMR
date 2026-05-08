import React from 'react';
import { Battery, Calendar, ShieldAlert, AlertCircle, ChevronRight } from 'lucide-react';
import { LOCK_STATUS_LABELS, LOCK_STATUS_DOT_STYLES } from '../utils/lockConstants';
import { formatShortDate, formatFloorCode } from '../utils/lockHelpers';

export function HealthBar({ score }) {
    const normalized = Number.isFinite(score) ? Math.max(0, Math.min(score, 100)) : 0;
    const tone = !Number.isFinite(score)
        ? 'bg-zinc-600'
        : normalized >= 70
            ? 'bg-emerald-500'
            : normalized >= 40
                ? 'bg-amber-400'
                : 'bg-red-500';

    return (
        <div className="flex items-center gap-3">
            <div className="h-2 w-full flex-1 rounded-full bg-[var(--color-border)] overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${tone}`} style={{ width: `${normalized}%` }} />
            </div>
            <div className={`w-9 text-right text-xs font-bold ${Number.isFinite(score) ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                {Number.isFinite(score) ? `${normalized}%` : 'N/A'}
            </div>
        </div>
    );
}

// eslint-disable-next-line no-unused-vars
export function DetailMetric({ label, value, icon: Icon, tone = 'text-[var(--color-text-primary)]' }) {
    return (
        <div className="flex flex-col justify-center rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-bg-primary)]/20 px-2.5 py-2 transition-colors hover:bg-[var(--color-bg-primary)]/40">
            <div className="mb-1 flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">
                <Icon className="h-3 w-3" />
                <span className="truncate">{label}</span>
            </div>
            <div className={`text-xs font-medium truncate ${tone}`}>{value}</div>
        </div>
    );
}

// eslint-disable-next-line no-unused-vars
export function SectionTitle({ icon: Icon, title, rightElement }) {
    return (
        <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 px-3 py-2.5 bg-[var(--color-bg-primary)]/10">
            <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                <h3 className="text-xs font-semibold text-[var(--color-text-primary)]">{title}</h3>
            </div>
            {rightElement && <div>{rightElement}</div>}
        </div>
    );
}

export function LockSummaryCard({ item, prediction, onOpen, showFloorBadge = true }) {
    const statusKey = item.status || 'operational';
    const statusDotClass = LOCK_STATUS_DOT_STYLES[statusKey] || LOCK_STATUS_DOT_STYLES.operational;
    const healthScore = prediction?.health_score ?? null;
    const floorLabel = formatFloorCode(item.floor_code);
    const batteryBarColor = healthScore === null ? 'bg-zinc-600'
        : healthScore > 60 ? 'bg-emerald-500'
            : healthScore > 30 ? 'bg-amber-400'
                : 'bg-red-500';
    const daysColor = !prediction ? 'text-[var(--color-text-muted)]'
        : prediction.days_remaining <= 0 ? 'text-red-400'
            : prediction.days_remaining <= 15 ? 'text-amber-400'
                : 'text-emerald-400';

    return (
        <button
            type="button"
            onClick={() => onOpen(item.room_id || item.id)}
            className="group relative rounded-xl border border-[var(--color-border)] bg-white p-2.5 text-left transition-all hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg-tertiary)] hover:shadow-md flex flex-col min-h-[130px]"
        >
            <div className="flex items-start justify-between">
                <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1">
                        {showFloorBadge && (
                            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                                {floorLabel}
                            </span>
                        )}
                        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Hab.</span>
                    </div>

                    <div className="mt-1">
                        <p className="text-base font-bold leading-tight text-[var(--color-text-primary)] text-center w-full">{item.room_number}</p>
                    </div>
                </div>

                <span
                    className={`mt-0.5 inline-flex h-2.5 w-2.5 rounded-full ${statusDotClass}`}
                    aria-label={LOCK_STATUS_LABELS[statusKey] || LOCK_STATUS_LABELS.operational}
                    title={LOCK_STATUS_LABELS[statusKey] || LOCK_STATUS_LABELS.operational}
                />
            </div>

            <div className="flex-1 flex flex-col justify-center gap-1.5 mt-2">
                <div>
                    <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                            <Battery className="h-3 w-3" />
                            Batería
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">
                            {healthScore !== null ? `${healthScore}%` : '—'}
                        </span>
                    </div>
                    <div className="h-1 w-full rounded-full bg-[var(--color-border)]">
                        <div
                            className={`h-1 rounded-full transition-all ${batteryBarColor}`}
                            style={{ width: `${healthScore ?? 0}%` }}
                        />
                    </div>
                </div>

                <div className={`flex items-center gap-1 text-[10px] font-semibold ${daysColor}`}>
                    <ShieldAlert className="h-3 w-3" />
                    {prediction
                        ? (prediction.days_remaining <= 0
                            ? `Vencida ${Math.abs(prediction.days_remaining)}d`
                            : `${prediction.days_remaining}d restantes`)
                        : 'Sin predicción'}
                </div>
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)]/40 pt-2 text-[10px] text-[var(--color-text-muted)]">
                <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {item.last_maintenance_at ? formatShortDate(item.last_maintenance_at) : 'Sin mant.'}
                </span>
                <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {item.events_count || 0} ev.
                </span>
            </div>

            <div className="absolute right-2.5 top-2.5 opacity-0 transition-opacity group-hover:opacity-100">
                <ChevronRight className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            </div>
        </button>
    );
}

