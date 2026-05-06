import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RACK_STATE_LABELS, getStateColors } from '../utils/rackHelpers';

const STAT_ORDER = ['available', 'occupied', 'reserved', 'dirty', 'maintenance', 'blocked', 'fdu'];

export default function RackModuleTabs({ modules, activeModule, onModuleChange, stats, arrivalsCount, departuresCount, filters, onFilterChange }) {
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

            {/* Stats pills aligned to the right */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide sm:ml-auto">
                <StatPill value={stats.total} label="Total" color="text-[var(--color-text-primary)]" />
                {STAT_ORDER.map(key => {
                    const count = stats[key] || 0;
                    if (!count) return null;
                    const colors = getStateColors(key);
                    return (
                        <StatPill
                            key={key}
                            value={count}
                            label={RACK_STATE_LABELS[key]}
                            color={colors.text}
                            active={filters.stateFilter === key}
                            onClick={() => onFilterChange({ stateFilter: filters.stateFilter === key ? '' : key, quickFilter: '' })}
                        />
                    );
                })}
                {arrivalsCount > 0 && (
                    <StatPill value={arrivalsCount} label="Entradas" color="text-emerald-400" />
                )}
                {departuresCount > 0 && (
                    <StatPill value={departuresCount} label="Salidas" color="text-red-400" />
                )}
            </div>
        </div>
    );
}

function StatPill({ value, label, color, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium transition-all shrink-0
                ${active
                    ? 'bg-[var(--color-bg-tertiary)] border-[var(--color-primary)]/40 ring-1 ring-[var(--color-primary)]/20'
                    : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                }
                ${onClick ? 'cursor-pointer' : 'cursor-default'}
            `}
        >
            <span className={`font-bold ${color}`}>{value}</span>
            <span className="text-[var(--color-text-muted)]">{label}</span>
        </button>
    );
}
