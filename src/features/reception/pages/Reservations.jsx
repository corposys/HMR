import { Hotel } from 'lucide-react';

export default function Reservations() {
    return (
        <div className="py-6 px-4 lg:px-8 w-full">
            <div className="mx-auto max-w-auto">
                <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10">
                            <Hotel className="w-6 h-6 text-[var(--color-primary)]" />
                        </div>
                        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Recepción</h1>
                    </div>
                    <p className="text-[var(--color-text-secondary)]">Reservas (en desarrollo)</p>
                </div>

                <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                    <div className="p-6 bg-[var(--color-bg-primary)]">
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Este módulo se desarrollará luego.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

