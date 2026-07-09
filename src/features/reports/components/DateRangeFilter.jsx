import { Calendar } from 'lucide-react';
import { PRESETS, buildRangeFromPreset } from './dateRangeUtils';

export default function DateRangeFilter({ value, onChange, presets = PRESETS }) {
    const { from, to } = value;
    const activePreset = presets.find((p) => {
        const r = buildRangeFromPreset(p.id);
        return r.from === from && r.to === to;
    });

    return (
        <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">Período:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                    <button
                        key={p.id}
                        type="button"
                        onClick={() => onChange(buildRangeFromPreset(p.id))}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            activePreset?.id === p.id
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
                <div className="flex flex-col">
                    <label className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-0.5">Desde</label>
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => onChange({ from: e.target.value, to })}
                        className="px-2 py-1.5 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)] mb-0.5">Hasta</label>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => onChange({ from, to: e.target.value })}
                        className="px-2 py-1.5 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                    />
                </div>
            </div>
        </div>
    );
}
