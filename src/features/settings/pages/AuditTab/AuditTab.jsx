import { ClipboardCheck } from 'lucide-react';
import { SettingsSection } from '@features/settings/components/settings/SettingsSection';

export default function AuditTab() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                    <ClipboardCheck className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">Auditoría</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">Preferencias de auditoría nocturna</p>
                </div>
            </div>
            <SettingsSection title="Auditoría Nocturna" description="Configuración del cierre diario" icon={ClipboardCheck}>
                <p className="text-sm text-[var(--color-text-secondary)]">Configuración de auditoría en desarrollo.</p>
            </SettingsSection>
        </div>
    );
}