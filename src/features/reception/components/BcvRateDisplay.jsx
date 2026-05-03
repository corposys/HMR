import { DollarSign, TrendingUp } from 'lucide-react';
import { useBcvRate } from '@hooks/useSettings';
import { formatCurrency } from '@utils/formatters';

export default function BcvRateDisplay({ className = '' }) {
    const { bcvRate, isLoading } = useBcvRate();

    if (isLoading) {
        return (
            <div className={`card p-4 flex items-center gap-3 ${className}`}>
                <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)] animate-pulse" />
                <div className="flex-1">
                    <div className="h-3 w-16 bg-[var(--color-bg-tertiary)] rounded animate-pulse mb-1" />
                    <div className="h-5 w-24 bg-[var(--color-bg-tertiary)] rounded animate-pulse" />
                </div>
            </div>
        );
    }

    if (!bcvRate) return null;

    return (
        <div className={`card p-4 flex items-center gap-3 ${className}`}>
            <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-medium">
                    Tasa BCV
                </p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                    {formatCurrency(bcvRate.rate, 'VES')} <span className="text-xs font-normal text-[var(--color-text-muted)]">/ USD</span>
                </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                <TrendingUp className="w-3 h-3" />
                <span>{bcvRate.source === 'manual' ? 'Manual' : 'API'}</span>
            </div>
        </div>
    );
}