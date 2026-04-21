/**
 * StatCard - Tarjeta de estadísticas para el dashboard
 */
export default function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendLabel,
    variant = 'default'
}) {
    const variantStyles = {
        default: 'text-[var(--color-text-primary)]',
        primary: 'text-[var(--color-primary)]',
        success: 'text-[var(--color-success)]',
        warning: 'text-[var(--color-warning)]',
        danger: 'text-[var(--color-danger)]',
    };

    const trendColor = trend > 0
        ? 'text-[var(--color-success)]'
        : trend < 0
            ? 'text-[var(--color-danger)]'
            : 'text-[var(--color-text-muted)]';

    return (
        <div className="stat-card">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-[var(--color-text-muted)] mb-2">{title}</p>
                    <p className={`stat-value ${variantStyles[variant]}`}>
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                            {subtitle}
                        </p>
                    )}
                </div>
                {Icon && (
                    <div className="p-2 bg-[var(--color-bg-tertiary)] rounded-lg">
                        <Icon className="w-5 h-5 text-[var(--color-text-muted)]" />
                    </div>
                )}
            </div>

            {typeof trend === 'number' && (
                <div className={`mt-4 pt-4 border-t border-[var(--color-border)] flex items-center gap-2 text-sm ${trendColor}`}>
                    <span>{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>
                    <span>{Math.abs(trend)}%</span>
                    {trendLabel && (
                        <span className="text-[var(--color-text-muted)]">{trendLabel}</span>
                    )}
                </div>
            )}
        </div>
    );
}
