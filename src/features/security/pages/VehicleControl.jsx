import React, { useState } from 'react';
import { 
    Shield, 
    Car, 
    Users, 
    ClipboardList, 
    Wrench, 
    BarChart3
} from 'lucide-react';
import Tabs from '@shared/common/Tabs';
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
        <div className="py-5 w-full px-5">
            <div className="mx-auto max-w-auto space-y-4">
            <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
                <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />

                <div className="p-6 bg-[var(--color-bg-primary)]">
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
