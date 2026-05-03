import Button from './Button';

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className = '' }) {
    return (
        <div className={`flex flex-col items-center gap-3 py-16 text-center ${className}`}>
            {Icon && <Icon className="w-12 h-12 text-[var(--color-text-muted)] opacity-40" />}
            {title && <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>}
            {description && <p className="text-xs text-[var(--color-text-muted)] max-w-sm">{description}</p>}
            {actionLabel && onAction && (
                <Button variant="primary" size="sm" onClick={onAction} className="mt-2">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}