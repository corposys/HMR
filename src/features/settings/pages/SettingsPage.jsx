import { useState } from 'react';
import { Users, Globe, Link as LinkIcon, Building2, Wrench } from 'lucide-react';
import Tabs from '@shared/common/Tabs';
import StructureTab from './StructureTab/StructureTab';
import GeneralSettingsTab from './GeneralSettingsTab/GeneralSettingsTab';
import LockTypesTab from './LockTypesTab/LockTypesTab';
import IntegrationsTab from './IntegrationsTab/IntegrationsTab';
import UsersTab from './UsersTab/UsersTab';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: Globe, component: GeneralSettingsTab },
        { id: 'structure', label: 'Estructura', icon: Building2, component: StructureTab },
        { id: 'locks', label: 'Cerraduras', icon: Wrench, component: LockTypesTab },
        { id: 'integrations', label: 'Integraciones', icon: LinkIcon, component: IntegrationsTab },
        { id: 'users', label: 'Usuarios', icon: Users, component: UsersTab },
    ];

    const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component;

    return (
        <div className="py-5 w-full px-5">
            <div className="mx-auto max-w-auto space-y-4">
                <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                    <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />
                    <div className="p-6 bg-[var(--color-bg-primary)] rounded-b-xl h-auto min-h-0">
                        {ActiveComponent ? <ActiveComponent /> : <div className="p-4 text-center">Componente no encontrado</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
