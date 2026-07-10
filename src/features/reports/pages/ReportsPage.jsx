import { useState } from 'react';
import { Lock, Printer, Ticket, PenLine } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import EmptyState from '@shared/common/EmptyState';
import DateRangeFilter from '@features/reports/components/DateRangeFilter';
import { buildRangeFromPreset } from '@features/reports/components/dateRangeUtils';
import { useReport } from '@features/reports/hooks/useReports';
import { usePermissions } from '@hooks/usePermissions';
import LocksReport from '@features/reports/components/LocksReport';
import PrintersReport from '@features/reports/components/PrintersReport';
import TicketsReport from '@features/reports/components/TicketsReport';
import SignaturesReport from '@features/reports/components/SignaturesReport';

const TABS = [
    { id: 'locks', label: 'Cerraduras', icon: Lock },
    { id: 'printers', label: 'Impresoras', icon: Printer },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'signatures', label: 'Firmas', icon: PenLine },
];

export default function ReportsPage() {
    const { can } = usePermissions();
    const [activeTab, setActiveTab] = useState('locks');
    const [range, setRange] = useState(() => buildRangeFromPreset('30d'));

    const { data, loading, error, refresh } = useReport(activeTab, range);

    const renderActiveTab = () => {
        if (activeTab === 'locks') {
            return <LocksReport data={data} loading={loading} error={error} range={range} refresh={refresh} />;
        }
        if (activeTab === 'printers') {
            return <PrintersReport data={data} loading={loading} error={error} range={range} refresh={refresh} />;
        }
        if (activeTab === 'tickets') {
            return <TicketsReport data={data} loading={loading} error={error} range={range} refresh={refresh} />;
        }
        if (activeTab === 'signatures') {
            return <SignaturesReport data={data} loading={loading} error={error} range={range} refresh={refresh} />;
        }
        return null;
    };

    if (!can('reports', 'read')) {
        return (
            <PageWrapper>
                <EmptyState
                    title="Sin permisos"
                    message="No tienes permiso para acceder al módulo de reportes."
                />
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="space-y-4">
                <nav className="flex overflow-x-auto border-b border-[var(--color-border)] -mx-5 px-5 scrollbar-hide" aria-label="Tabs de reportes">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    isActive
                                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                        : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)]'
                                }`}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                <DateRangeFilter value={range} onChange={setRange} />

                <div>{renderActiveTab()}</div>
            </div>
        </PageWrapper>
    );
}
