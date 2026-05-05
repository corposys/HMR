import { useState } from 'react';
import { ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { getModuleStats, getStateColors, RACK_STATE_LABELS } from '../utils/rackHelpers';
import RackRoomCard from './RackRoomCard';

const STATE_ORDER = ['available', 'occupied', 'reserved', 'dirty', 'maintenance', 'blocked', 'fdu'];

export default function RackModuleSection({ module, viewMode, onRoomClick, defaultOpen = true }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const stats = getModuleStats(module.floors.flatMap(f => f.rooms));

    return (
        <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90">
            {/* Module header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/45 hover:bg-[var(--color-bg-primary)]/60 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                        {module.module_name}
                    </h2>
                    <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
                        {module.floors.reduce((sum, f) => sum + f.rooms.length, 0)} hab
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Mini stats */}
                    <div className="hidden md:flex items-center gap-1.5">
                        {STATE_ORDER.map(key => {
                            const count = stats[key];
                            if (!count) return null;
                            const colors = getStateColors(key);
                            return (
                                <span
                                    key={key}
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors.pill}`}
                                >
                                    {count} {RACK_STATE_LABELS[key]}
                                </span>
                            );
                        })}
                    </div>
                    {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                    )}
                </div>
            </button>

            {/* Floors */}
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="space-y-1">
                    {module.floors.map(floor => (
                        <article key={floor.floor_id}>
                            <div className="flex items-center justify-between px-4 py-1.5 bg-[var(--color-bg-primary)]/25">
                                <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                                    Piso {floor.floor_code}
                                </span>
                                <span className="text-[10px] text-[var(--color-text-muted)]/70">
                                    {floor.rooms.length} hab
                                </span>
                            </div>
                            <div className={`p-2 grid ${VIEW_CONFIG[viewMode]?.gridCols || 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8'} ${VIEW_CONFIG[viewMode]?.gap || 'gap-1'}`}>
                                {floor.rooms.map(room => (
                                    <RackRoomCard
                                        key={room.id}
                                        room={room}
                                        viewMode={viewMode}
                                        onClick={onRoomClick}
                                    />
                                ))}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

const VIEW_CONFIG = {
    compact: { gridCols: 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12', gap: 'gap-1' },
    normal: { gridCols: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8', gap: 'gap-2' },
    expanded: { gridCols: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5', gap: 'gap-2' },
};
