export default function Card({
    children,
    className = '',
    padding = 'md',
    hover = false,
    elevated = false,
    ...props
}) {
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const cardType = elevated ? 'card-elevated' : 'card';
    const hoverStyles = hover ? 'hover:border-[var(--color-border-hover)] cursor-pointer' : '';

    return (
        <div
            className={`${cardType} ${paddingStyles[padding]} ${hoverStyles} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }) {
    return (
        <div className={`mb-4 ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '' }) {
    return (
        <h3 className={`text-lg font-semibold text-[var(--color-text-primary)] ${className}`}>
            {children}
        </h3>
    );
}

export function CardDescription({ children, className = '' }) {
    return (
        <p className={`text-sm text-[var(--color-text-secondary)] mt-1 ${className}`}>
            {children}
        </p>
    );
}

export function CardContent({ children, className = '' }) {
    return (
        <div className={className}>
            {children}
        </div>
    );
}

export function CardFooter({ children, className = '' }) {
    return (
        <div className={`flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[var(--color-border)] ${className}`}>
            {children}
        </div>
    );
}