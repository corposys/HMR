import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(function Input(
    { label, icon: Icon, error, className = '', type, ...props },
    ref
) {
    const [showPassword, setShowPassword] = useState(false);
    
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

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
                    type={inputType}
                    className={`input ${Icon ? '!pl-10' : ''} ${isPassword ? '!pr-10' : ''} ${error ? 'border-[var(--color-danger)]' : ''} ${className}`}
                    {...props}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors focus:outline-none cursor-pointer"
                    >
                        {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                        ) : (
                            <Eye className="w-4 h-4" />
                        )}
                    </button>
                )}
            </div>
            {error && (
                <p className="mt-1 text-xs text-[var(--color-danger)]">{error}</p>
            )}
        </div>
    );
});

export default Input;