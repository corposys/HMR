import { cn } from '@/lib/utils';

export function SettingsGroup({ children, className = '' }) {
    return (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
            {children}
        </div>
    );
}