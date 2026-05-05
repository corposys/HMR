import {
    Search,
    Wifi,
    WifiOff,
    RefreshCw,
    BedDouble,
    LogIn,
    LogOut,
    Sparkles,
    LayoutGrid,
    LayoutList,
    Maximize2,
} from 'lucide-react';
import Button from '@shared/common/Button';
import RackStats from './RackStats';
import RackFilters from './RackFilters';

const QUICK_FILTERS = [
    { key: 'all', label: 'Todos', icon: LayoutGrid },
    { key: 'dirty', label: 'Solo Limpieza', icon: Sparkles },
    { key: 'departures', label: 'Salidas hoy', icon: LogOut },
    { key: 'arrivals', label: 'Entradas hoy', icon: LogIn },
];

const VIEW_MODES = [
    { key: 'compact', label: 'Compacta', icon: LayoutGrid },
    { key: 'normal', label: 'Normal', icon: LayoutList },
    { key: 'expanded', label: 'Expandida', icon: Maximize2 },
];

export default function RackHeader({
    stats,
    arrivalsCount,
    departuresCount,
    connected,
    lastUpdate,
    filters,
    onFilterChange,
    uniqueFloors,
    uniqueTypes,
    onRefresh,
    viewMode,
    onViewModeChange,
    bcvRate,
}) {
    const isQuickActive = (key) => {
        if (key === 'all') return !filters.quickFilter;
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
            {/* Fila 1: Título + controles + BCV */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
                        Rack Operativo
                    </h1>

                    {/* Live indicator */}
                    {connected ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/5 border border-emerald-500/10">
                            <Wifi className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] font-medium text-emerald-400">En vivo</span>
                            {lastUpdate && (
                                <span className="text-[10px] text-emerald-400/60">
                                    {lastUpdate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/5 border border-red-500/10">
                            <WifiOff className="w-3 h-3 text-red-400" />
                            <span className="text-[10px] font-medium text-red-400">Offline</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* BCV rate */}
                    {bcvRate && (
                        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                            <span className="text-[10px] text-[var(--color-text-muted)]">BCV:</span>
                            <span className="text-xs font-semibold text-[var(--color-text-primary)]">{bcvRate.toFixed(2)}</span>
                            <span className="text-[10px] text-[var(--color-text-muted)]">VES/USD</span>
                        </div>
                    )}

                    {/* View mode toggle */}
                    <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
                        {VIEW_MODES.map(vm => {
                            const Icon = vm.icon;
                            const active = viewMode === vm.key;
                            return (
                                <button
                                    key={vm.key}
                                    onClick={() => onViewModeChange(vm.key)}
                                    className={`
                                        flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors
                                        ${active
                                            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                        }
                                    `}
                                    title={vm.label}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{vm.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        icon={RefreshCw}
                        onClick={onRefresh}
                        title="Actualizar"
                    />
                </div>
            </div>

            {/* Fila 2: Arrivals/Departures badges + Quick filters */}
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                    <BedDouble className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <span className="text-sm font-bold">{stats.total}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">hab</span>
                </div>

                {arrivalsCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <LogIn className="w-3 h-3 text-emerald-400" />
                        <span className="text-xs font-semibold text-emerald-400">{arrivalsCount}</span>
                        <span className="text-[10px] text-emerald-400/70">entradas hoy</span>
                    </div>
                )}

                {departuresCount > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                        <LogOut className="w-3 h-3 text-red-400" />
                        <span className="text-xs font-semibold text-red-400">{departuresCount}</span>
                        <span className="text-[10px] text-red-400/70">salidas hoy</span>
                    </div>
                )}

                <div className="w-px h-6 bg-[var(--color-border)] hidden sm:block" />

                {QUICK_FILTERS.map(qf => {
                    const Icon = qf.icon;
                    const active = isQuickActive(qf.key);
                    return (
                        <button
                            key={qf.key}
                            onClick={() => handleQuickFilter(qf.key)}
                            className={`
                                inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150
                                ${active
                                    ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)]'
                                }
                            `}
                        >
                            <Icon className="w-3 h-3" />
                            {qf.label}
                        </button>
                    );
                })}
            </div>

            {/* Fila 3: Stats pills + Filters */}
            <div className="space-y-2">
                <RackStats stats={stats} activeFilter={filters.stateFilter} onFilterChange={onFilterChange} />
                <RackFilters
                    filters={filters}
                    onFilterChange={onFilterChange}
                    uniqueFloors={uniqueFloors}
                    uniqueTypes={uniqueTypes}
                />
            </div>
        </div>
    );
}
