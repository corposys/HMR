import { Lock, Wrench, AlertTriangle, ClipboardCheck, Package } from 'lucide-react';
import ReportSection from './ReportSection';
import ReportTable from './ReportTable';
import ReportOptionCard from './ReportOptionCard';

const STATUS_LABELS = {
    operational: 'Operativas',
    needs_review: 'Revisión',
    out_of_service: 'Fuera de servicio',
};

const EVENT_LABELS = {
    battery: 'Batería',
    mechanical: 'Mecánico',
    reprogramming: 'Reprogramación',
};

const REPORT_TYPE_LABELS = {
    lock_failure: 'Falla de cerradura',
    room_issue: 'Problema de habitación',
    equipment_issue: 'Problema de equipo',
    other: 'Otro',
};

const DEPT_LABELS = {
    reception: 'Recepción',
    housekeeping: 'Limpieza',
    maintenance: 'Mantenimiento',
    systems: 'Sistemas',
};

export default function LocksReport({ data, loading, error, range }) {
    const statusDist = data?.status_distribution || {};
    const eventsByType = data?.events_by_type || [];
    const eventsByDay = data?.events_by_day || [];
    const partsConsumption = data?.parts_consumption || [];
    const openReports = data?.open_reports || [];
    const batteryAlerts = data?.battery_alerts;

    return (
        <ReportSection loading={loading} error={error} data={data}>
            <div className="space-y-4">
                <ReportOptionCard
                    icon={Lock}
                    title="Resumen de estado"
                    description={`${statusDist.total || 0} cerraduras — ${statusDist.operational || 0} operativas, ${statusDist.needs_review || 0} en revisión, ${statusDist.out_of_service || 0} fuera de servicio`}
                    columns={[
                        { key: 'status', label: 'Estado', render: (r) => STATUS_LABELS[r.status] || r.status },
                        { key: 'count', label: 'Cantidad', align: 'right' },
                    ]}
                    rows={[
                        { status: 'operational', count: statusDist.operational || 0 },
                        { status: 'needs_review', count: statusDist.needs_review || 0 },
                        { status: 'out_of_service', count: statusDist.out_of_service || 0 },
                    ]}
                    filename={`cerraduras_estado_${range.from}_${range.to}.csv`}
                >
                    <ReportTable
                        columns={[
                            { key: 'status', label: 'Estado', render: (r) => STATUS_LABELS[r.status] || r.status },
                            { key: 'count', label: 'Cantidad', align: 'right' },
                        ]}
                        rows={[
                            { status: 'operational', count: statusDist.operational || 0 },
                            { status: 'needs_review', count: statusDist.needs_review || 0 },
                            { status: 'out_of_service', count: statusDist.out_of_service || 0 },
                        ]}
                    />
                </ReportOptionCard>

                <ReportOptionCard
                    icon={Wrench}
                    title="Mantenimientos del período"
                    description={`${eventsByDay.reduce((a, d) => a + d.count, 0)} eventos registrados (${range.from} → ${range.to})`}
                    columns={[
                        { key: 'type', label: 'Tipo', render: (r) => EVENT_LABELS[r.type] || r.type },
                        { key: 'count', label: 'Eventos', align: 'right' },
                    ]}
                    rows={eventsByType.map((e) => ({ type: e.type, count: e.count }))}
                    filename={`cerraduras_mantenimientos_${range.from}_${range.to}.csv`}
                >
            <div className="space-y-4">
                        <ReportTable
                            columns={[
                                { key: 'type', label: 'Tipo', render: (r) => EVENT_LABELS[r.type] || r.type },
                                { key: 'count', label: 'Eventos', align: 'right' },
                            ]}
                            rows={eventsByType.map((e) => ({ type: e.type, count: e.count }))}
                            empty="No hay eventos de mantenimiento en el período."
                        />
                    </div>
                </ReportOptionCard>

                <ReportOptionCard
                    icon={AlertTriangle}
                    title="Alertas de batería"
                    description={batteryAlerts
                        ? `${batteryAlerts.overdue} vencidas · ${batteryAlerts.upcoming_15d} próximas (≤15 días)`
                        : 'Sin datos de predicción'}
                    columns={[
                        { key: 'label', label: 'Tipo' },
                        { key: 'count', label: 'Cantidad', align: 'right' },
                    ]}
                    rows={batteryAlerts ? [
                        { label: 'Vencidas', count: batteryAlerts.overdue || 0 },
                        { label: 'Próximas (≤15 días)', count: batteryAlerts.upcoming_15d || 0 },
                    ] : []}
                    filename={`cerraduras_bateria_${range.from}_${range.to}.csv`}
                >
                    <ReportTable
                        columns={[
                            { key: 'label', label: 'Tipo' },
                            { key: 'count', label: 'Cantidad', align: 'right' },
                        ]}
                        rows={batteryAlerts ? [
                            { label: 'Vencidas', count: batteryAlerts.overdue || 0 },
                            { label: 'Próximas (≤15 días)', count: batteryAlerts.upcoming_15d || 0 },
                        ] : []}
                    />
                </ReportOptionCard>

                <ReportOptionCard
                    icon={ClipboardCheck}
                    title="Reportes operativos abiertos"
                    description={`${openReports.length} pendientes por resolver`}
                    columns={[
                        { key: 'room_number', label: 'Hab.' },
                        { key: 'report_type', label: 'Tipo', render: (r) => REPORT_TYPE_LABELS[r.report_type] || r.report_type },
                        { key: 'source_department', label: 'Depto.', render: (r) => DEPT_LABELS[r.source_department] || r.source_department },
                        { key: 'issue_description', label: 'Descripción' },
                        { key: 'created_at', label: 'Reportado', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString('es') : '—' },
                    ]}
                    rows={openReports}
                    filename={`cerraduras_reportes_operativos_${range.from}_${range.to}.csv`}
                >
                    <ReportTable
                        columns={[
                            { key: 'room_number', label: 'Habitación' },
                            { key: 'report_type', label: 'Tipo', render: (r) => REPORT_TYPE_LABELS[r.report_type] || r.report_type },
                            { key: 'source_department', label: 'Departamento', render: (r) => DEPT_LABELS[r.source_department] || r.source_department },
                            { key: 'issue_description', label: 'Descripción' },
                            { key: 'created_at', label: 'Reportado', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString('es') : '—' },
                        ]}
                        rows={openReports}
                        empty="No hay reportes operativos abiertos."
                    />
                </ReportOptionCard>

                <ReportOptionCard
                    icon={Package}
                    title="Repuestos consumidos"
                    description={`${partsConsumption.length} tipos de repuesto usados en el período`}
                    columns={[
                        { key: 'part', label: 'Repuesto' },
                        { key: 'used', label: 'Cantidad', align: 'right' },
                    ]}
                    rows={partsConsumption}
                    filename={`cerraduras_repuestos_${range.from}_${range.to}.csv`}
                >
                    <ReportTable
                        columns={[
                            { key: 'part', label: 'Repuesto' },
                            { key: 'used', label: 'Cantidad', align: 'right' },
                        ]}
                        rows={partsConsumption}
                        empty="No se registraron consumos de repuestos en el período."
                    />
                </ReportOptionCard>
            </div>
        </ReportSection>
    );
}
