import { AlertTriangle, Wrench, Package, UserX, Hammer, FileQuestion } from 'lucide-react';

const TYPE_CONFIG = {
    broken_item: { icon: Wrench, label: 'Artículo roto', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    missing_inventory: { icon: Package, label: 'Falta inventario', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    maintenance_needed: { icon: Hammer, label: 'Mantenimiento', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    guest_belongings: { icon: UserX, label: 'Objetos huésped', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    damage: { icon: AlertTriangle, label: 'Daño', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    other: { icon: FileQuestion, label: 'Otro', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
};

const SEVERITY_CONFIG = {
    low: { label: 'Baja', dot: 'bg-gray-400' },
    medium: { label: 'Media', dot: 'bg-yellow-400' },
    high: { label: 'Alta', dot: 'bg-orange-400' },
    critical: { label: 'Crítica', dot: 'bg-red-400 animate-pulse' },
};

export default function IncidentBadge({ incident, compact = false }) {
    const typeConfig = TYPE_CONFIG[incident.incident_type] || TYPE_CONFIG.other;
    const severityConfig = SEVERITY_CONFIG[incident.severity] || SEVERITY_CONFIG.low;
    const Icon = typeConfig.icon;

    if (compact) {
        return (
            <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${typeConfig.color}`}>
                <Icon className="w-2.5 h-2.5" />
                {typeConfig.label}
            </span>
        );
    }

    return (
        <div className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-medium ${typeConfig.color}`}>
            <Icon className="w-3 h-3" />
            {typeConfig.label}
            <span className={`h-1.5 w-1.5 rounded-full ${severityConfig.dot}`} title={`Severidad: ${severityConfig.label}`} />
            {incident.resolved && (
                <span className="text-[10px] text-emerald-400 ml-1">Resuelta</span>
            )}
        </div>
    );
}

export function IncidentTypeSelector({ value, onChange }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const isSelected = value === key;
                return (
                    <button
                        key={key}
                        onClick={() => onChange(key)}
                        className={`
                            flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all duration-150
                            ${isSelected
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-text-primary)]'
                                : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                            }
                        `}
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{config.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export function SeveritySelector({ value, onChange }) {
    const options = [
        { key: 'low', label: 'Baja', color: 'bg-gray-400' },
        { key: 'medium', label: 'Media', color: 'bg-yellow-400' },
        { key: 'high', label: 'Alta', color: 'bg-orange-400' },
        { key: 'critical', label: 'Crítica', color: 'bg-red-400' },
    ];

    return (
        <div className="flex items-center gap-2">
            {options.map(opt => (
                <button
                    key={opt.key}
                    onClick={() => onChange(opt.key)}
                    className={`
                        flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-150
                        ${value === opt.key
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-text-primary)]'
                            : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                        }
                    `}
                >
                    <span className={`h-2 w-2 rounded-full ${opt.color}`} />
                    {opt.label}
                </button>
            ))}
        </div>
    );
}
