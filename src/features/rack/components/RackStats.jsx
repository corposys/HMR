import { BedDouble, User, CalendarClock, Sparkles, Wrench, Ban, XOctagon } from 'lucide-react';
import { RACK_STATE_LABELS, getStateColors } from '../utils/rackHelpers';

const STAT_CONFIG = [
    { key: 'available', label: RACK_STATE_LABELS.available, icon: BedDouble },
    { key: 'occupied', label: RACK_STATE_LABELS.occupied, icon: User },
    { key: 'reserved', label: RACK_STATE_LABELS.reserved, icon: CalendarClock },
    { key: 'dirty', label: RACK_STATE_LABELS.dirty, icon: Sparkles },
    { key: 'maintenance', label: RACK_STATE_LABELS.maintenance, icon: Wrench },
    { key: 'blocked', label: RACK_STATE_LABELS.blocked, icon: Ban },
    { key: 'fdu', label: RACK_STATE_LABELS.fdu, icon: XOctagon },
];

export default function RackStats({ stats, activeFilter, onFilterChange }) {
    const handleClick = (key) => {
        if (activeFilter === key) {
            onFilterChange({ stateFilter: '' });
        } else {
            onFilterChange({ stateFilter: key, quickFilter: '' });
        }
    };

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {STAT_CONFIG.map((item) => {
                const { key, label, icon: IconComponent } = item;
                const colors = getStateColors(key);
                const count = stats[key] || 0;
                const isActive = activeFilter === key;
                return (
                    <button
                        key={key}
                        onClick={() => handleClick(key)}
                        className={`
                            flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium
                            transition-all duration-150 shrink-0
                            ${isActive
                                ? `${colors.bg} ${colors.text} ${colors.border} ring-1 ring-inset ring-white/10`
                                : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)]'
                            }
                        `}
                    >
                        <IconComponent className="w-3 h-3" />
                        <span className={isActive ? colors.text : ''}>{count}</span>
                        <span className="hidden sm:inline opacity-70">{label}</span>
                    </button>
                );
            })}
        </div>
    );
}
