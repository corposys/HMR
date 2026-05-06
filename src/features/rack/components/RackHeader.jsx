import {
    RefreshCw, LayoutGrid, Sparkles, LogIn, LogOut,
    Search
} from 'lucide-react';

const QUICK_FILTERS = [
    { key: 'all', label: 'Todos', icon: LayoutGrid, showCount: false },
];



export default function RackHeader({
    filters,
    onFilterChange,
    onRefresh,
    bcvRate,
    arrivalsCount = 0,
    departuresCount = 0,
    dirtyCount = 0,
}) {
    const isQuickActive = (key) => {
        if (key === 'all') return !filters.quickFilter && !filters.stateFilter;
        return filters.quickFilter === key;
    };

    const handleQuickFilter = (key) => {
        if (key === 'all') {
            onFilterChange({ quickFilter: '', stateFilter: '', searchQuery: '' });
        } else if (key === 'dirty') {
            onFilterChange({ quickFilter: key, stateFilter: 'dirty', searchQuery: '' });
        } else {
            onFilterChange({ quickFilter: key, stateFilter: '', searchQuery: '' });
        }
    };

    return (
        <div className="space-y-3">
            {/* Row 1: Quick filters + search + filter toggle + refresh */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {QUICK_FILTERS.map(qf => {
                        const Icon = qf.icon;
                        const active = isQuickActive(qf.key);
                        return (
                            <button
                                key={qf.key}
                                onClick={() => handleQuickFilter(qf.key)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 shrink-0 border
                                    ${active
                                        ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/30'
                                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)]'
                                    }`}
                            >
                                <Icon className="w-3 h-3" />
                                {qf.label}
                            </button>
                        );
                    })}
                    {arrivalsCount > 0 && (
                        <button
                            onClick={() => handleQuickFilter('arrivals')}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 shrink-0 border
                                ${isQuickActive('arrivals')
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)]'
                                }`}
                        >
                            <LogIn className="w-3 h-3" />
                            Entradas
                            <span className="ml-0.5 font-bold text-emerald-400">{arrivalsCount}</span>
                        </button>
                    )}
                    {departuresCount > 0 && (
                        <button
                            onClick={() => handleQuickFilter('departures')}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 shrink-0 border
                                ${isQuickActive('departures')
                                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)]'
                                }`}
                        >
                            <LogOut className="w-3 h-3" />
                            Salidas
                            <span className="ml-0.5 font-bold text-red-400">{departuresCount}</span>
                        </button>
                    )}
                    {dirtyCount > 0 && (
                        <button
                            onClick={() => handleQuickFilter('dirty')}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150 shrink-0 border
                                ${isQuickActive('dirty')
                                    ? 'bg-red-500/15 text-red-400 border-red-500/30'
                                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)]'
                                }`}
                        >
                            <Sparkles className="w-3 h-3" />
                            Limpieza
                            <span className="ml-0.5 font-bold text-red-400">{dirtyCount}</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:ml-auto">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={filters.searchQuery}
                            onChange={e => onFilterChange({ searchQuery: e.target.value })}
                            className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-sm rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                    </div>
                    {bcvRate && (
                        <div className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-md bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-xs shrink-0">
                            <span className="text-[var(--color-text-muted)]">BCV</span>
                            <span className="font-semibold text-[var(--color-text-primary)]">${bcvRate.toFixed(2)}</span>
                        </div>
                    )}
                    <button
                        onClick={onRefresh}
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors shrink-0"
                        title="Actualizar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}


