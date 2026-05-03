import { forwardRef } from 'react';

const Input = forwardRef(function Input(
    { label, icon: Icon, error, className = '', ...props },
    ref
) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                )}
                <input
                    ref={ref}
                    className={`input ${Icon ? 'pl-9' : ''} ${error ? 'border-[var(--color-danger)]' : ''} ${className}`}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>
            )}
        </div>
    );
});

export default Input;