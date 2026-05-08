import { Calendar } from 'lucide-react';

export default function DateTimePicker({ value, onChange, className = '' }) {
    return (
        <div className={`relative ${className}`}>
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)] pointer-events-none" />
            <input
                type="datetime-local"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none [color-scheme:dark]"
            />
        </div>
    );
}
