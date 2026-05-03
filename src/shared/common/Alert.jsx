import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const typeConfig = {
    error: {
        icon: AlertCircle,
        classes: 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
    },
    success: {
        icon: CheckCircle,
        classes: 'border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]',
    },
    warning: {
        icon: AlertTriangle,
        classes: 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    },
    info: {
        icon: Info,
        classes: 'border-[var(--color-info)]/30 bg-[var(--color-info)]/10 text-[var(--color-info)]',
    },
};

export default function Alert({ type = 'info', title, children, className = '' }) {
    const config = typeConfig[type] || typeConfig.info;
    const Icon = config.icon;

    return (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${config.classes} ${className}`}>
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
                {title && <p className="font-medium mb-0.5">{title}</p>}
                {children && <p className="opacity-80">{children}</p>}
            </div>
        </div>
    );
}