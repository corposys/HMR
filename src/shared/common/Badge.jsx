const variantClasses = {
    primary: 'badge badge-primary',
    success: 'badge badge-success',
    warning: 'badge badge-warning',
    danger: 'badge badge-danger',
    info: 'badge badge-info',
};

export default function Badge({ children, variant = 'primary', className = '', ...props }) {
    return (
        <span className={`${variantClasses[variant] || variantClasses.primary} ${className}`} {...props}>
            {children}
        </span>
    );
}