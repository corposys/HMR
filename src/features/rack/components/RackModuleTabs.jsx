import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RACK_STATE_LABELS, getStateColors } from '../utils/rackHelpers';

const STAT_ORDER = ['available', 'occupied', 'reserved', 'maintenance', 'blocked', 'fdu'];

export default function RackModuleTabs({ modules, activeModule, onModuleChange, stats, filters, onFilterChange }) {
    const handleStatClick = (key) => {
        if (key === 'all') {
            onFilterChange({ stateFilter: '', quickFilter: '', searchQuery: '' });
        } else {
            onFilterChange({ stateFilter: filters.stateFilter === key ? '' : key, quickFilter: '' });
        }
    };

    const isStatActive = (key) => {
        if (key === 'all') return !filters.stateFilter && !filters.quickFilter;
        return filters.stateFilter === key;
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
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-xs shrink-0">
                    <span className="font-bold text-[var(--color-text-primary)]">{stats.total}</span>
                    <span className="text-[var(--color-text-muted)]">Total</span>
                </div>
                {STAT_ORDER.map(key => {
                    const count = stats[key] || 0;
                    if (!count) return null;
                    const colors = getStateColors(key);
                    const isActive = isStatActive(key);
                    return (
                        <button
                            key={key}
                            onClick={() => handleStatClick(key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 transition-all
                                ${isActive
                                    ? `${colors.bg} ${colors.border} ${colors.text}`
                                    : `bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:${colors.bg} hover:${colors.border}`
                                }
                            `}
                        >
                            <span className={`font-bold ${colors.text}`}>{count}</span>
                            <span className="text-[var(--color-text-muted)]">{RACK_STATE_LABELS[key]}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
