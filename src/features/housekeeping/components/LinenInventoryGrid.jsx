import { useState, useMemo } from 'react';
import { Package, AlertTriangle, Edit2 } from 'lucide-react';
import { apiFetch } from '@utils/api';

const CATEGORY_COLORS = {
    bedding: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    bathroom: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    amenity: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    other: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

const CATEGORY_LABELS = {
    bedding: 'Ropa de cama',
    bathroom: 'Toallas y baño',
    amenity: 'Amenidades',
    other: 'Otros',
};

export default function LinenInventoryGrid({ linenTypes, inventory, loading, onUpdate }) {
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const groupedInventory = useMemo(() => {
        const grouped = {};
        linenTypes.forEach(type => {
            if (categoryFilter !== 'all' && type.category !== categoryFilter) return;
            grouped[type.id] = {
                ...type,
                floors: [],
            };
        });

        inventory.forEach(item => {
            if (grouped[item.linen_type_id]) {
                grouped[item.linen_type_id].floors.push(item);
            }
        });

        return Object.values(grouped);
    }, [linenTypes, inventory, categoryFilter]);

    const handleUpdateQuantity = async (linenTypeId, floorId, quantity) => {
        await apiFetch('/api/housekeeping/linen/inventory', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ linen_type_id: linenTypeId, floor_id: floorId, quantity: Number(quantity) }),
        });
        setEditingId(null);
        onUpdate();
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] animate-pulse p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-border)]" />
                            <div className="w-20 h-4 rounded bg-[var(--color-border)]" />
                        </div>
                        <div className="w-full h-2 rounded bg-[var(--color-border)] mb-2" />
                        <div className="w-2/3 h-2 rounded bg-[var(--color-border)]" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium shrink-0 transition-all duration-150 ${categoryFilter === 'all' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'}`}
                >
                    Todos
                </button>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setCategoryFilter(key)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium shrink-0 transition-all duration-150 ${categoryFilter === key ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedInventory.map(type => {
                    const totalQty = type.floors.reduce((sum, f) => sum + f.quantity, 0);
                    const totalPar = type.par_level;
                    const isBelowPar = totalQty < totalPar;
                    const pct = totalPar > 0 ? Math.round((totalQty / totalPar) * 100) : 0;

                    return (
                        <div
                            key={type.id}
                            className={`rounded-xl border transition-all duration-150 overflow-hidden ${isBelowPar ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]'}`}
                        >
                            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]/50">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)]">
                                        <Package className="w-4 h-4 text-[var(--color-text-muted)]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{type.name}</p>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${CATEGORY_COLORS[type.category]}`}>
                                            {CATEGORY_LABELS[type.category]}
                                        </span>
                                    </div>
                                </div>
                                {isBelowPar && (
                                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                )}
                            </div>

                            <div className="px-3 py-2">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-[var(--color-text-muted)]">Total</span>
                                    <span className="font-bold">{totalQty} / {totalPar} {type.unit}</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-[var(--color-bg-tertiary)] overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                </div>

                                <div className="mt-2 space-y-1">
                                    {type.floors.map(floor => (
                                        <div key={floor.floor_id} className="flex items-center justify-between text-[11px]">
                                            <span className="text-[var(--color-text-muted)]">{floor.floor_code || `Piso ${floor.floor_id}`}</span>
                                            {editingId === `${type.id}-${floor.floor_id}` ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={editValue}
                                                        onChange={e => setEditValue(e.target.value)}
                                                        className="w-12 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-1 py-0.5 text-xs text-center"
                                                        autoFocus
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleUpdateQuantity(type.id, floor.floor_id, editValue);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => { setEditingId(`${type.id}-${floor.floor_id}`); setEditValue(String(floor.quantity)); }}
                                                    className="flex items-center gap-1 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                                                >
                                                    {floor.quantity} {type.unit}
                                                    <Edit2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {type.floors.length === 0 && (
                                        <p className="text-[10px] text-[var(--color-text-muted)]">Sin inventario registrado</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
