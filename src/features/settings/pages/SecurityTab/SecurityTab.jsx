import { Shield } from 'lucide-react';
import { SettingsSection } from '@features/settings/components/settings/SettingsSection';

export default function SecurityTab() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                    <Shield className="w-5 h-5 text-red-500" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">Seguridad</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">Sesiones, accesos y logs</p>
                </div>
            </div>
            <SettingsSection title="Configuración de Seguridad" description="Gestión de acceso y sesiones" icon={Shield}>
                <p className="text-sm text-[var(--color-text-secondary)]">Configuración de seguridad en desarrollo.</p>
            </SettingsSection>
        </div>
    );
}