import React, { useState } from 'react';
import { Settings as SettingsIcon, Users, Globe, Link as LinkIcon, Building2 } from 'lucide-react';
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
        <div className="py-6 w-full px-4 lg:px-8">
            <div className="mx-auto max-w-auto">
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10">
                            <SettingsIcon className="w-6 h-6 text-[var(--color-primary)]" />
                        </div>
                        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Configuración</h1>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-visible">
                <div className="border-b border-[var(--color-border)]">
                    <nav className="flex overflow-x-auto" aria-label="Tabs">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                                        ${isActive
                                            ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                            : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'}
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="p-6 bg-[var(--color-bg-primary)]">
                    {(() => {
                        const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;
                        return ActiveComponent ? <ActiveComponent /> : <div className="p-4 text-center">Componente no encontrado</div>;
                    })()}
                </div>
            </div>
        </div>
    );
}
