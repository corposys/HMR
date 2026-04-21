import React, { useState } from 'react';
import { 
    Shield, 
    Car, 
    Users, 
    ClipboardList, 
    Wrench, 
    BarChart3
} from 'lucide-react';
import OverviewTab from '@features/security/components/OverviewTab';
import InventoryTab from '@features/security/components/InventoryTab';
import DriversTab from '@features/security/components/DriversTab';
import DailyLogsTab from '@features/security/components/DailyLogsTab';
import MaintenanceTab from '@features/security/components/MaintenanceTab';
import FinancialAnalyticsTab from '@features/security/components/FinancialAnalyticsTab';

export default function VehicleControl() {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Vista General', icon: Shield, component: OverviewTab },
        { id: 'inventory', label: 'Inventario', icon: Car, component: InventoryTab },
        { id: 'drivers', label: 'Choferes', icon: Users, component: DriversTab },
        { id: 'dailylogs', label: 'Bitácora Diaria', icon: ClipboardList, component: DailyLogsTab },
        { id: 'maintenance', label: 'Mantenimiento', icon: Wrench, component: MaintenanceTab },
        { id: 'analytics', label: 'Analíticas', icon: BarChart3, component: FinancialAnalyticsTab },
    ];

    return (
        <div className="py-6 w-full px-4 lg:px-8">
            <div className="mx-auto max-w-auto">
                <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10">
                            <Shield className="w-6 h-6 text-[var(--color-primary)]" />
                        </div>
                        <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Control de Vehículos</h1>
                    </div>
                </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
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
