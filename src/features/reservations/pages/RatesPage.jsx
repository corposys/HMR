import { useState } from 'react';
import { Calendar, Grid3X3, Users, Calculator } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import Tabs from '@shared/common/Tabs';
import SeasonManager from '@features/reservations/components/SeasonManager';
import RateMatrix from '@features/reservations/components/RateMatrix';
import OccupancyConfigManager from '@features/reservations/components/OccupancyConfigManager';
import QuoteTester from '@features/reservations/components/QuoteTester';

const TABS = [
    { id: 'seasons', label: 'Temporadas', icon: Calendar },
    { id: 'matrix', label: 'Matriz de Tarifas', icon: Grid3X3 },
    { id: 'occupancy', label: 'Ocupación', icon: Users },
    { id: 'quote', label: 'Cotizador', icon: Calculator },
];

export default function RatesPage() {
    const [activeTab, setActiveTab] = useState('seasons');

    return (
        <PageWrapper>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Temporadas y Tarifas</h1>
                    <p className="text-sm text-[var(--color-text-muted)]">Gestión de tarifas dinámicas por temporada y ocupación</p>
                </div>
            </div>

            <Tabs items={TABS} activeId={activeTab} onChange={setActiveTab} />

            <div className="pt-4">
                {activeTab === 'seasons' && <SeasonManager />}
                {activeTab === 'matrix' && <RateMatrix />}
                {activeTab === 'occupancy' && <OccupancyConfigManager />}
                {activeTab === 'quote' && <QuoteTester />}
            </div>
        </PageWrapper>
    );
}
