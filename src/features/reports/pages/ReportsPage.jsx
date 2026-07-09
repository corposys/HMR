import { useState } from 'react';
import { ClipboardCheck, Lock, Printer, Ticket, PenLine, RefreshCcw } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import Tabs from '@shared/common/Tabs';
import Button from '@shared/common/Button';
import EmptyState from '@shared/common/EmptyState';
import DateRangeFilter from '@features/reports/components/DateRangeFilter';
import { buildRangeFromPreset } from '@features/reports/components/dateRangeUtils';
import { useReport } from '@features/reports/hooks/useReports';
import { usePermissions } from '@hooks/usePermissions';
import ReportsOverview from '@features/reports/components/ReportsOverview';
import LocksReport from '@features/reports/components/LocksReport';
import PrintersReport from '@features/reports/components/PrintersReport';
import TicketsReport from '@features/reports/components/TicketsReport';
import SignaturesReport from '@features/reports/components/SignaturesReport';

const TABS = [
    { id: 'overview', label: 'Resumen General', icon: ClipboardCheck },
    { id: 'locks', label: 'Cerraduras', icon: Lock },
    { id: 'printers', label: 'Impresoras', icon: Printer },
    { id: 'tickets', label: 'Tickets', icon: Ticket },
    { id: 'signatures', label: 'Firmas', icon: PenLine },
];

export default function ReportsPage() {
    const { can } = usePermissions();
    const [activeTab, setActiveTab] = useState('overview');
    const [range, setRange] = useState(() => buildRangeFromPreset('30d'));

    const showRangeFilter = activeTab !== 'overview';

    const { data, loading, error, refresh } = useReport(
        activeTab,
        showRangeFilter ? range : { from: null, to: null }
    );

    const renderActiveTab = () => {
        if (activeTab === 'overview') {
            return <ReportsOverview data={data} loading={loading} error={error} />;
        }
        if (activeTab === 'locks') {
            return <LocksReport data={data} loading={loading} error={error} range={range} />;
        }
        if (activeTab === 'printers') {
            return <PrintersReport data={data} loading={loading} error={error} range={range} />;
        }
        if (activeTab === 'tickets') {
            return <TicketsReport data={data} loading={loading} error={error} range={range} />;
        }
        if (activeTab === 'signatures') {
            return <SignaturesReport data={data} loading={loading} error={error} range={range} />;
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
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                        <ClipboardCheck className="w-6 h-6 text-[var(--color-primary)]" />
                        Reportes
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        Analítica consolidada de cerraduras, impresoras, tickets y firmas
                    </p>
                </div>
                <Button
                    variant="secondary"
                    icon={RefreshCcw}
                    onClick={refresh}
                    size="sm"
                >
                    Actualizar
                </Button>
            </div>

            <div className="space-y-4">
                <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] -mx-5 px-5 -mt-5">
                    <Tabs items={TABS} activeId={activeTab} onChange={setActiveTab} />
                </div>

                {showRangeFilter && (
                    <DateRangeFilter value={range} onChange={setRange} />
                )}

                <div>{renderActiveTab()}</div>
            </div>
        </PageWrapper>
    );
}
