import { RefreshCw, LayoutGrid, LogIn, LogOut, Search, X, BedDouble, DoorOpen } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import CustomDropdown from '@shared/common/CustomDropdown';

const STATE_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'available', label: 'Disponible' },
    { value: 'occupied', label: 'Ocupada' },
    { value: 'reserved', label: 'Reservada' },
    { value: 'dirty', label: 'Sucia' },
    { value: 'maintenance', label: 'Mantenimiento' },
    { value: 'blocked', label: 'Bloqueada' },
    { value: 'fdu', label: 'FDU' },
];

export default function RackHeader({
    filters,
    onFilterChange,
    onRefresh,
    bcvRate,
    arrivalsCount = 0,
    departuresCount = 0,
    stats,
}) {
    return (
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
            <CardHeader className="py-3 px-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                <LayoutGrid className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                <span><strong className="text-[var(--color-text-primary)]">{stats?.total ?? 0}</strong> total</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                <DoorOpen className="w-3.5 h-3.5 text-emerald-400" />
                                <span><strong className="text-[var(--color-text-primary)]">{stats?.available ?? 0}</strong> disp.</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                <BedDouble className="w-3.5 h-3.5 text-blue-400" />
                                <span><strong className="text-[var(--color-text-primary)]">{stats?.occupied ?? 0}</strong> ocup.</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                                <span><strong className="text-[var(--color-text-primary)]">{arrivalsCount}</strong> hoy</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                <LogOut className="w-3.5 h-3.5 text-red-400" />
                                <span><strong className="text-[var(--color-text-primary)]">{departuresCount}</strong> sal.</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <CustomDropdown
                            value={filters.stateFilter}
                            onChange={(v) => onFilterChange({ stateFilter: v })}
                            options={STATE_FILTERS}
                            placeholder="Estado"
                            className="min-w-[160px]"
                            buttonClassName="h-8"
                        />

                        <div className="relative w-full sm:w-56 h-8">
                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                value={filters.searchQuery}
                                onChange={e => onFilterChange({ searchQuery: e.target.value })}
                                placeholder="Buscar habitación..."
                                className="w-full h-full pl-8 pr-8 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                            />
                            {filters.searchQuery && (
                                <button
                                    onClick={() => onFilterChange({ searchQuery: '' })}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {bcvRate && (
                            <div className="hidden lg:flex items-center gap-1 px-2 py-1.5 rounded-md bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-xs shrink-0">
                                <span className="text-[var(--color-text-muted)]">BCV</span>
                                <span className="font-semibold text-[var(--color-text-primary)]">${bcvRate.toFixed(2)}</span>
                            </div>
                        )}

                        <button
                            onClick={onRefresh}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] shrink-0"
                            title="Actualizar"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );
}