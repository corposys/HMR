import { Clock } from 'lucide-react';
import { SettingsSection } from '@features/settings/components/settings/SettingsSection';

export default function ReceptionTab() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                    <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">Recepción</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">Horarios y políticas de check-in/out</p>
                </div>
            </div>
            <SettingsSection title="Horarios" description="Configuración de check-in y check-out" icon={Clock}>
                <p className="text-sm text-[var(--color-text-secondary)]">Configuración de recepción en desarrollo.</p>
            </SettingsSection>
        </div>
    );
}