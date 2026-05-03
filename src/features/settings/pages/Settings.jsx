import React, { useState } from 'react';
import { Users, Globe, Link as LinkIcon, Building2 } from 'lucide-react';
import Tabs from '@shared/common/Tabs';
import HotelStructureTab from './HotelStructureTab';
import GeneralTab from './GeneralTab';

// Simple mock components for the new tabs
function IntegrationsTab() {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Integraciones</h3>
            <p className="text-[var(--color-text-secondary)]">Gestión de conexiones con otras aplicaciones.</p>
            <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
                <ul className="list-disc pl-5 space-y-2">
                    <li>Motor de Reservas <span className="text-green-500 ml-2">(Conectado)</span></li>
                    <li>Sistema Housekeeping <span className="text-green-500 ml-2">(Conectado)</span></li>
                    <li>POS Restaurante <span className="text-yellow-500 ml-2">(Sincronizando)</span></li>
                </ul>
            </div>
        </div>
    );
}

function UsersTab() {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Usuarios y Roles</h3>
            <p className="text-[var(--color-text-secondary)]">Administración de acceso al dashboard HMR.</p>
            <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
                <p>Usuarios Activos: <strong>12</strong></p>
                <p>Roles Definidos: <strong>5</strong></p>
            </div>
        </div>
    );
}

export default function Settings() {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: Globe, component: GeneralTab },
        { id: 'structure', label: 'Estructura', icon: Building2, component: HotelStructureTab },
        { id: 'integrations', label: 'Integraciones', icon: LinkIcon, component: IntegrationsTab },
        { id: 'users', label: 'Usuarios', icon: Users, component: UsersTab },
    ];

    return (
        <div className="py-5 w-full px-5">
            <div className="mx-auto max-w-auto space-y-4">
            <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />

                <div className="p-6 bg-[var(--color-bg-primary)] rounded-b-xl h-auto min-h-0">
                    {(() => {
                        const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;
                        return ActiveComponent ? <ActiveComponent /> : <div className="p-4 text-center">Componente no encontrado</div>;
                    })()}
                </div>
            </div>
            </div>
        </div>
    );
}
