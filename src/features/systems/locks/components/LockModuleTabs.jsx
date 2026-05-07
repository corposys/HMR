import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, CheckCircle2, ShieldAlert, TriangleAlert, X } from 'lucide-react';

const STATUS_FILTERS = [
    {
        value: 'all',
        label: 'Todas',
        icon: Activity,
        key: 'total',
        tone: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    },
    {
        value: 'operational',
        label: 'Operativas',
        icon: CheckCircle2,
        key: 'healthy',
        tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    },
    {
        value: 'preventive',
        label: 'Preventivas',
        icon: ShieldAlert,
        key: 'preventive',
        tone: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    },
    {
        value: 'failure',
        label: 'Falla',
        icon: TriangleAlert,
        key: 'failure',
        tone: 'border-red-500/30 bg-red-500/10 text-red-300',
    },
    {
        value: 'out_of_service',
        label: 'Fuera de servicio',
        icon: X,
        key: 'out_of_service',
        tone: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
    },
];

export default function LockModuleTabs({
    modules,
    activeModule,
    onModuleChange,
    statusFilter,
    setStatusFilter,
    operationalSummary,
    failureCount,
    outOfServiceCount
}) {
    const handleStatClick = (value) => {
        setStatusFilter(value);
    };

    const getCount = (key) => {
        if (key === 'failure') return failureCount;
        if (key === 'out_of_service') return outOfServiceCount;
        return operationalSummary[key] || 0;
    };

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Tabs value={activeModule} onValueChange={onModuleChange} className="w-full sm:w-auto">
                <TabsList className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] h-auto flex-nowrap gap-1 p-1 justify-start overflow-x-auto scrollbar-hide">
                    {modules.map(mod => (
                        <TabsTrigger
                            key={mod.id}
                            value={mod.id}
                            className="data-[state=active]:bg-[var(--color-bg-tertiary)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)] text-xs px-3 py-1.5 rounded-md whitespace-nowrap shrink-0"
                        >
                            <span>{mod.name}</span>
                            <span className="ml-1.5 text-[10px] text-[var(--color-text-muted)] data-[state=active]:text-[var(--color-text-muted)]">
                                {mod.count}
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide sm:ml-auto">
                {STATUS_FILTERS.map(option => {
                    const count = getCount(option.key);
                    const isActive = statusFilter === option.value;
                    const Icon = option.icon;

                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => handleStatClick(option.value)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 transition-all ${
                                isActive
                                    ? `${option.tone} shadow-sm`
                                    : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]'
                            }`}
                        >
                            <Icon className="h-3 w-3 shrink-0" />
                            <span>{option.label}</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${isActive ? 'bg-white/10 text-current' : 'bg-[var(--color-bg-primary)]/80 text-[var(--color-text-muted)]'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}