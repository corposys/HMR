import { Settings as SettingsIcon } from 'lucide-react';

export default function SystemTab() {
    return (
        <div className="p-6 space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-500/10">
                    <SettingsIcon className="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">Sistema</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">Preferencias y configuración del sistema</p>
                </div>
            </div>
            <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] p-5">
                <p className="text-sm text-[var(--color-text-secondary)]">Configuración del sistema en desarrollo.</p>
            </div>
        </div>
    );
}