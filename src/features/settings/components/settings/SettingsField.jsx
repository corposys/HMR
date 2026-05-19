import { cn } from '@/lib/utils';

export function SettingsGroup({ children, className = '' }) {
    return (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
            {children}
        </div>
    );
}

export function SettingsField({ label, hint, error, children, className = '' }) {
    return (
        <div className={cn('space-y-1.5', className)}>
            {label && (
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                    {label}
                </label>
            )}
            {children}
            {hint && !error && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
            {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
        </div>
    );
}