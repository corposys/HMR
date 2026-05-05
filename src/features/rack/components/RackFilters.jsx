import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import Input from '@shared/common/Input';
import Button from '@shared/common/Button';
import { RACK_STATES, RACK_STATE_LABELS } from '../utils/rackHelpers';

export default function RackFilters({ filters, onFilterChange, uniqueFloors, uniqueTypes }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                    <Input
                        icon={Search}
                        placeholder="Buscar por número, huésped o tipo..."
                        value={filters.searchQuery}
                        onChange={e => onFilterChange({ searchQuery: e.target.value })}
                    />
                </div>
                <Button
                    variant={expanded ? 'primary' : 'secondary'}
                    size="sm"
                    icon={expanded ? ChevronUp : ChevronDown}
                    onClick={() => setExpanded(!expanded)}
                    className="shrink-0"
                >
                    <span className="hidden sm:inline">Filtros</span>
                </Button>
            </div>

            {expanded && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Piso</label>
                        <select
                            className="input w-full text-sm"
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
                            className="input w-full text-sm"
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
                            className="input w-full text-sm"
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
