/**
 * Button - Botón reutilizable con múltiples variantes
 * Diseño minimalista con transiciones suaves
 */
export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    className = '',
    ...props
}) {
    const baseStyles = 'btn inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
        danger: 'bg-[var(--color-danger)] text-white border-[var(--color-danger)] hover:opacity-90',
        register: 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white border border-transparent !rounded-full !px-4 !py-2 shadow-sm',
        back: 'bg-transparent text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-tertiary)] !rounded-full !px-3.5 !py-1.5',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-2.5 text-base',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
            {...props}
        >
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </button>
    );
}
