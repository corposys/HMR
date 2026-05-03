import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ className = '', size = 'md' }) {
    const sizes = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={`flex items-center justify-center py-16 ${className}`}>
            <Loader2 className={`${sizes[size]} animate-spin text-[var(--color-primary)]`} />
        </div>
    );
}