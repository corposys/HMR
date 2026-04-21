/**
 * Card - Contenedor con estilo de tarjeta
 */
export default function Card({
    children,
    className = '',
    padding = 'md',
    hover = false,
    ...props
}) {
    const paddingStyles = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    const hoverStyles = hover ? 'hover:border-[var(--color-border-hover)] cursor-pointer' : '';

    return (
        <div
            className={`card ${paddingStyles[padding]} ${hoverStyles} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

/**
 * CardHeader - Cabecera de la tarjeta
 */
export function CardHeader({ children, className = '' }) {
    return (
        <div className={`mb-4 ${className}`}>
            {children}
        </div>
    );
}

/**
 * CardTitle - Título de la tarjeta
 */
export function CardTitle({ children, className = '' }) {
    return (
        <h3 className={`text-lg font-semibold text-[var(--color-text-primary)] ${className}`}>
            {children}
        </h3>
    );
}

/**
 * CardDescription - Descripción de la tarjeta
 */
export function CardDescription({ children, className = '' }) {
    return (
        <p className={`text-sm text-[var(--color-text-secondary)] mt-1 ${className}`}>
            {children}
        </p>
    );
}

/**
 * CardContent - Contenido de la tarjeta
 */
export function CardContent({ children, className = '' }) {
    return (
        <div className={className}>
            {children}
        </div>
    );
}
