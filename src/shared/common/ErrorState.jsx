import { AlertCircle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({ message, onRetry, className = '' }) {
    return (
        <div className={`flex flex-col items-center gap-3 py-16 text-center ${className}`}>
            <AlertCircle className="w-10 h-10 text-[var(--color-danger)]" />
            <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">{message}</p>
            {onRetry && (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                    Reintentar
                </Button>
            )}
        </div>
    );
}