import { ClipboardCheck } from 'lucide-react';

export default function HousekeepingControlPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-[var(--color-text-muted)]">
            <ClipboardCheck className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Control</h2>
            <p className="text-center">Inspección e Incidencias</p>
        </div>
    );
}