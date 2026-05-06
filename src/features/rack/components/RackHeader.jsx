import { useState } from 'react';
import {
    RefreshCw, LayoutGrid, Sparkles, LogIn, LogOut,
    Search, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { RACK_STATES, RACK_STATE_LABELS } from '../utils/rackHelpers';

const QUICK_FILTERS = [
    { key: 'all', label: 'Todos', icon: LayoutGrid },
    { key: 'dirty', label: 'Limpieza', icon: Sparkles },
    { key: 'departures', label: 'Salidas', icon: LogOut },
    { key: 'arrivals', label: 'Entradas', icon: LogIn },
];



export default function RackHeader({
    filters,
    onFilterChange,
    uniqueFloors,
    uniqueTypes,
    onRefresh,
    bcvRate,
}) {
    const [showFilters, setShowFilters] = useState(false);

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
                    <button
                        onClick={() => setShowFilters(s => !s)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0
                            ${showFilters
                                ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/30'
                                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]'
                            }`}
                    >
                        <Filter className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Filtros</span>
                        {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
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

            {/* Row 3: Expandable filters */}
            {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Piso</label>
                        <select
                            className="w-full text-sm rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] px-3 py-1.5 focus:outline-none focus:border-[var(--color-primary)]"
                            value={filters.floorFilter}
                            onChange={e => onFilterChange({ floorFilter: e.target.value })}
                        >
                            <option value="">Todos los pisos</option>
                            {uniqueFloors.map(floor => (
                                <option key={floor.id} value={floor.id}>
                                    {floor.code} — {floor.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Tipo de habitación</label>
                        <select
                            className="w-full text-sm rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] px-3 py-1.5 focus:outline-none focus:border-[var(--color-primary)]"
                            value={filters.typeFilter}
                            onChange={e => onFilterChange({ typeFilter: e.target.value })}
                        >
                            <option value="">Todos los tipos</option>
                            {uniqueTypes.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Estado</label>
                        <select
                            className="w-full text-sm rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] px-3 py-1.5 focus:outline-none focus:border-[var(--color-primary)]"
                            value={filters.stateFilter}
                            onChange={e => onFilterChange({ stateFilter: e.target.value })}
                        >
                            <option value="">Todos los estados</option>
                            {Object.values(RACK_STATES).map(state => (
                                <option key={state} value={state}>
                                    {RACK_STATE_LABELS[state]}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}
        </div>
    );
}


