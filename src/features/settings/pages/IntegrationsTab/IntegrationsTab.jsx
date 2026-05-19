import { useState } from 'react';
import { Link as LinkIcon, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@components/ui/button';
import { SettingsSection } from '@features/settings/components/settings/SettingsSection';

const INTEGRATIONS = [
    { id: 'booking', name: 'Motor de Reservas', description: 'Sincronización de reservas desde web externa', status: 'connected' },
    { id: 'housekeeping', name: 'Sistema Housekeeping', description: 'Gestión de limpieza y mantenimiento', status: 'connected' },
    { id: 'pos', name: 'POS Restaurante', description: 'Punto de venta para restaurante y bar', status: 'pending' },
    { id: 'channel', name: 'Channel Manager', description: 'Sincronización con OTA (Booking, Expedia)', status: 'disconnected' },
    { id: 'payment', name: 'Pasarela de Pago', description: 'Procesamiento de pagos con tarjeta', status: 'disconnected' },
];

const STATUS_CONFIG = {
    connected: { label: 'Conectado', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
    pending: { label: 'Pendiente', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    disconnected: { label: 'No conectado', icon: AlertTriangle, color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
};

export default function IntegrationsTab() {
    const [connecting, setConnecting] = useState(null);

    const handleConnect = async (id) => {
        setConnecting(id);
        await new Promise((r) => setTimeout(r, 1500));
        setConnecting(null);
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Gestiona las conexiones con servicios externos</p>
            </div>

            <SettingsSection title="Integraciones Disponibles" icon={LinkIcon}>
                <div className="space-y-3">
                    {INTEGRATIONS.map((integration) => {
                        const cfg = STATUS_CONFIG[integration.status];
                        const Icon = cfg.icon;
                        return (
                            <div key={integration.id} className="flex items-center justify-between py-3 px-1 hover:bg-[var(--color-bg-tertiary)]/30 transition-colors rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${cfg.bg}`}>
                                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{integration.name}</span>
                                        <span className="text-xs text-[var(--color-text-muted)]">{integration.description}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-md ${cfg.bg} ${cfg.color} font-medium`}>{cfg.label}</span>
                                    {integration.status !== 'connected' && (
                                        <Button variant="outline" size="sm" loading={connecting === integration.id} onClick={() => handleConnect(integration.id)}>
                                            <LinkIcon className="w-3.5 h-3.5" />
                                            {connecting === integration.id ? 'Conectando...' : 'Conectar'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SettingsSection>
        </div>
    );
}