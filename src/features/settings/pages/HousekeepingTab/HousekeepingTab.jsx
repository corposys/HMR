import { Sparkles } from 'lucide-react';
import { SettingsSection } from '@features/settings/components/settings/SettingsSection';

export default function HousekeepingTab() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10">
                    <Sparkles className="w-5 h-5 text-teal-500" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">Housekeeping</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">Configuración de limpieza y mantenimiento de habitaciones</p>
                </div>
            </div>
            <SettingsSection title="Estados de Limpieza" description="Configuración por defecto de habitaciones" icon={Sparkles}>
                <p className="text-sm text-[var(--color-text-secondary)]">Configuración de housekeeping en desarrollo.</p>
            </SettingsSection>
        </div>
    );
}