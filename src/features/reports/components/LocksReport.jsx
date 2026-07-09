import { Lock, AlertTriangle, Wrench, Package } from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import KPIRow from './KPIRow';
import ChartCard from './ChartCard';
import ReportTable from './ReportTable';
import ReportSection from './ReportSection';
import ExportButton from './ExportButton';

const STATUS_COLORS = {
    operational: '#10b981',
    needs_review: '#f59e0b',
    out_of_service: '#ef4444',
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
    const statusData = data?.status_distribution
        ? [
            { name: 'Operativas', value: data.status_distribution.operational ?? 0, key: 'operational' },
            { name: 'Revisión', value: data.status_distribution.needs_review ?? 0, key: 'needs_review' },
            { name: 'Fuera de servicio', value: data.status_distribution.out_of_service ?? 0, key: 'out_of_service' },
          ]
        : [];

    const eventsTypeData = data?.events_by_type
        ? data.events_by_type.map((e) => ({
            name: EVENT_LABELS[e.type] || e.type,
            Eventos: e.count,
        }))
        : [];

    const partsData = data?.parts_consumption || [];
    const batteryAlerts = data?.battery_alerts;
    const eventsByDay = data?.events_by_day || [];
    const openReports = data?.open_reports || [];

    const kpiItems = data && data.status_distribution && batteryAlerts
        ? [
            {
                title: 'Cerraduras totales',
                value: data.status_distribution.total,
                icon: Lock,
                variant: 'primary',
            },
            {
                title: 'Operativas',
                value: `${data.status_distribution.operational}/${data.status_distribution.total}`,
                subtitle: `${Math.round((data.status_distribution.operational / Math.max(data.status_distribution.total, 1)) * 100)}% del total`,
                icon: Lock,
                variant: 'success',
            },
            {
                title: 'Alertas de batería',
                value: batteryAlerts.overdue + batteryAlerts.upcoming_15d,
                subtitle: `${batteryAlerts.overdue} vencidas · ${batteryAlerts.upcoming_15d} ≤15d`,
                icon: AlertTriangle,
                variant: batteryAlerts.overdue > 0 ? 'danger' : 'warning',
            },
            {
                title: 'Eventos del período',
                value: eventsByDay.reduce((acc, d) => acc + d.count, 0),
                subtitle: 'Mantenimientos registrados',
                icon: Wrench,
                variant: 'default',
            },
        ]
        : [];

    return (
        <ReportSection loading={loading} error={error} data={data}>
            <div className="space-y-6">
                <KPIRow items={kpiItems} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard
                        title="Distribución de estados"
                        description="Estado actual de las cerraduras"
                    >
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                        labelLine={false}
                                    >
                                        {statusData.map((entry) => (
                                            <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--color-bg-elevated)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            color: 'var(--color-text-primary)',
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    <ChartCard
                        title="Eventos por tipo"
                        description={`Mantenimientos en el período (${range.from} → ${range.to})`}
                    >
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={eventsTypeData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} />
                                    <YAxis stroke="var(--color-text-muted)" fontSize={12} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--color-bg-elevated)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            color: 'var(--color-text-primary)',
                                        }}
                                    />
                                    <Bar dataKey="Eventos" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

                <ChartCard
                    title="Repuestos más consumidos"
                    description="Top 10 partes usadas en mantenimientos del período"
                >
                    <div className="mb-3 flex justify-end">
                        <ExportButton
                            rows={partsData}
                            filename={`cerraduras_partes_${range.from}_${range.to}.csv`}
                            columns={[
                                { key: 'part', label: 'Repuesto' },
                                { key: 'used', label: 'Cantidad usada' },
                            ]}
                        />
                    </div>
                    {partsData.length === 0 ? (
                        <p className="text-center py-6 text-sm text-[var(--color-text-muted)]">
                            No se registraron consumos de repuestos en el período.
                        </p>
                    ) : (
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={partsData} layout="vertical" margin={{ left: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                                    <XAxis type="number" stroke="var(--color-text-muted)" fontSize={12} allowDecimals={false} />
                                    <YAxis
                                        type="category"
                                        dataKey="part"
                                        stroke="var(--color-text-muted)"
                                        fontSize={11}
                                        width={140}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--color-bg-elevated)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            color: 'var(--color-text-primary)',
                                        }}
                                    />
                                    <Bar dataKey="used" fill="var(--color-warning)" radius={[0, 4, 4, 0]} name="Cantidad" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </ChartCard>

                <ChartCard
                    title="Reportes operativos abiertos"
                    description="Pendientes por resolver"
                >
                    <ReportTable
                        columns={[
                            { key: 'room_number', label: 'Habitación' },
                            { key: 'floor_code', label: 'Piso', render: (r) => `M${r.module_number} ${r.floor_code}` },
                            { key: 'report_type', label: 'Tipo', render: (r) => REPORT_TYPE_LABELS[r.report_type] || r.report_type },
                            { key: 'source_department', label: 'Departamento', render: (r) => DEPT_LABELS[r.source_department] || r.source_department },
                            { key: 'issue_description', label: 'Descripción' },
                            { key: 'created_at', label: 'Reportado', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString('es') : '—' },
                        ]}
                        rows={openReports}
                        empty="No hay reportes operativos abiertos."
                    />
                </ChartCard>
            </div>
        </ReportSection>
    );
}
