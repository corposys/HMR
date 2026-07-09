import { Lock, PenLine, Printer, Ticket, Wrench } from 'lucide-react';
import KPIRow from './KPIRow';
import ChartCard from './ChartCard';
import ReportSection from './ReportSection';

export default function ReportsOverview({ data, loading, error }) {
    const locks = data?.locks;
    const tickets = data?.tickets;
    const printers = data?.printers;
    const toners = data?.toners;
    const signatures = data?.signatures;

    const kpiItems = data && locks && tickets && printers && toners && signatures
        ? [
            {
                title: 'Cerraduras operativas',
                value: `${locks.operational}/${locks.total}`,
                subtitle: `${locks.needs_review} en revisión · ${locks.out_of_service} fuera de servicio`,
                icon: Lock,
                variant: locks.operational / Math.max(locks.total, 1) >= 0.85 ? 'success' : 'warning',
            },
            {
                title: 'Tickets activos',
                value: tickets.backlog,
                subtitle: `${tickets.open} nuevos · ${tickets.in_progress} en curso`,
                icon: Ticket,
                variant: tickets.backlog > 5 ? 'danger' : 'default',
            },
            {
                title: 'Impresoras operativas',
                value: `${printers.operational}/${printers.total}`,
                subtitle: `${printers.maintenance} mantto · ${printers.out_of_service} fuera`,
                icon: Printer,
                variant: printers.operational / Math.max(printers.total, 1) >= 0.85 ? 'success' : 'warning',
            },
            {
                title: 'Stock de tóners',
                value: toners.total_stock,
                subtitle: `${toners.low_stock_items} modelos con stock bajo`,
                icon: Wrench,
                variant: toners.low_stock_items > 0 ? 'warning' : 'default',
            },
            {
                title: 'Firmas generadas',
                value: signatures.total,
                subtitle: 'Acumulado del sistema',
                icon: PenLine,
                variant: 'primary',
            },
        ]
        : [];

    return (
        <ReportSection loading={loading} error={error} data={data}>
            <div className="space-y-6">
                <KPIRow items={kpiItems} columns={5} />

                {locks && tickets && printers && toners && signatures && (
                    <ChartCard
                        title="Resumen de operación"
                        description="Vista consolidada del estado actual de los módulos"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)]/50">
                                <h4 className="font-semibold mb-2 text-[var(--color-text-primary)]">Cerraduras</h4>
                                <ul className="space-y-1 text-[var(--color-text-secondary)]">
                                    <li>Total: <span className="text-[var(--color-text-primary)] font-medium">{locks.total}</span></li>
                                    <li>Operativas: <span className="text-[var(--color-success)] font-medium">{locks.operational}</span></li>
                                    <li>Revisión: <span className="text-[var(--color-warning)] font-medium">{locks.needs_review}</span></li>
                                    <li>Fuera de servicio: <span className="text-[var(--color-danger)] font-medium">{locks.out_of_service}</span></li>
                                </ul>
                            </div>
                            <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)]/50">
                                <h4 className="font-semibold mb-2 text-[var(--color-text-primary)]">Tickets</h4>
                                <ul className="space-y-1 text-[var(--color-text-secondary)]">
                                    <li>Total: <span className="text-[var(--color-text-primary)] font-medium">{tickets.total}</span></li>
                                    <li>Abiertos: <span className="text-[var(--color-danger)] font-medium">{tickets.open}</span></li>
                                    <li>En progreso: <span className="text-[var(--color-warning)] font-medium">{tickets.in_progress}</span></li>
                                    <li>Resueltos: <span className="text-[var(--color-success)] font-medium">{tickets.resolved}</span></li>
                                </ul>
                            </div>
                            <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)]/50">
                                <h4 className="font-semibold mb-2 text-[var(--color-text-primary)]">Impresoras</h4>
                                <ul className="space-y-1 text-[var(--color-text-secondary)]">
                                    <li>Total: <span className="text-[var(--color-text-primary)] font-medium">{printers.total}</span></li>
                                    <li>Hotel: <span className="text-[var(--color-text-primary)] font-medium">{printers.hotel}</span></li>
                                    <li>Corporativo: <span className="text-[var(--color-text-primary)] font-medium">{printers.corpo}</span></li>
                                    <li>Operativas: <span className="text-[var(--color-success)] font-medium">{printers.operational}</span></li>
                                </ul>
                            </div>
                        </div>
                    </ChartCard>
                )}
            </div>
        </ReportSection>
    );
}
