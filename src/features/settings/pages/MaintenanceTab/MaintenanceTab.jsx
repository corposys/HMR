import { Wrench } from 'lucide-react';
import { SettingsSection } from '@features/settings/components/settings/SettingsSection';

export default function MaintenanceTab() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                    <Wrench className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">Mantenimiento</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">Planes preventivos y tipos de repuestos</p>
                </div>
            </div>
            <SettingsSection title="Configuración de Mantenimiento" description="Gestión de mantenimiento" icon={Wrench}>
                <p className="text-sm text-[var(--color-text-secondary)]">Configuración de mantenimiento en desarrollo.</p>
            </SettingsSection>
        </div>
    );
}