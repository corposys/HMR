import { Ticket, AlertOctagon, Users, Hash } from 'lucide-react';
import ReportSection from './ReportSection';
import ReportTable from './ReportTable';
import ReportOptionCard from './ReportOptionCard';

const STATUS_LABELS = {
    open: 'Abiertos',
    in_progress: 'En progreso',
    resolved: 'Resueltos',
    closed: 'Cerrados',
};

const PRIORITY_LABELS = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta',
    urgente: 'Urgente',
};

const PRIORITY_COLORS = {
    baja: '#3b82f6',
    media: '#10b981',
    alta: '#f59e0b',
    urgente: '#ef4444',
};

const CATEGORY_LABELS = {
    hardware: 'Hardware',
    software: 'Software',
    conectividad: 'Conectividad',
    otro: 'Otro',
};

export default function TicketsReport({ data, loading, error, range }) {
    const byStatus = data?.by_status || [];
    const byCategory = data?.by_category || [];
    const backlog = data?.backlog ?? [];
    const byAssignee = data?.by_assignee || [];

    return (
        <ReportSection loading={loading} error={error} data={data}>
            <div className="space-y-4">
                <ReportOptionCard
                    icon={Ticket}
                    title="Resumen por estado"
                    description={`${byStatus.reduce((a, s) => a + s.count, 0)} tickets en el período`}
                    columns={[
                        { key: 'status', label: 'Estado', render: (r) => STATUS_LABELS[r.status] || r.status },
                        { key: 'count', label: 'Cantidad', align: 'right' },
                    ]}
                    rows={byStatus.map((s) => ({ status: s.status, count: s.count }))}
                    filename={`tickets_estado_${range.from}_${range.to}.csv`}
                >
                    <ReportTable
                        columns={[
                            { key: 'status', label: 'Estado', render: (r) => STATUS_LABELS[r.status] || r.status },
                            { key: 'count', label: 'Cantidad', align: 'right' },
                        ]}
                        rows={byStatus.map((s) => ({ status: s.status, count: s.count }))}
                        empty="No hay tickets en el período."
                    />
                </ReportOptionCard>

                <ReportOptionCard
                    icon={AlertOctagon}
                    title="Backlog actual"
                    description={`${backlog.length} tickets abiertos o en progreso`}
                    columns={[
                        { key: 'ticket_number', label: 'Nº' },
                        { key: 'title', label: 'Título' },
                        { key: 'priority', label: 'Prioridad', render: (r) => (
                            <span style={{ color: PRIORITY_COLORS[r.priority] }} className="font-medium">
                                {PRIORITY_LABELS[r.priority] || r.priority}
                            </span>
                        )},
                        { key: 'status', label: 'Estado', render: (r) => STATUS_LABELS[r.status] || r.status },
                        { key: 'category', label: 'Categoría', render: (r) => CATEGORY_LABELS[r.category] || r.category },
                        { key: 'assigned_name', label: 'Asignado', render: (r) => r.assigned_name || '—' },
                        { key: 'created_at', label: 'Creado', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString('es') : '—' },
                    ]}
                    rows={backlog}
                    filename={`tickets_backlog_${range.from}_${range.to}.csv`}
                >
                    <ReportTable
                        columns={[
                            { key: 'ticket_number', label: 'Nº' },
                            { key: 'title', label: 'Título' },
                            { key: 'priority', label: 'Prioridad', render: (r) => (
                                <span style={{ color: PRIORITY_COLORS[r.priority] }} className="font-medium">
                                    {PRIORITY_LABELS[r.priority] || r.priority}
                                </span>
                            )},
                            { key: 'status', label: 'Estado', render: (r) => STATUS_LABELS[r.status] || r.status },
                            { key: 'category', label: 'Categoría', render: (r) => CATEGORY_LABELS[r.category] || r.category },
                            { key: 'assigned_name', label: 'Asignado', render: (r) => r.assigned_name || '—' },
                            { key: 'created_at', label: 'Creado', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString('es') : '—' },
                        ]}
                        rows={backlog}
                        empty="No hay tickets en el backlog."
                    />
                </ReportOptionCard>

                <ReportOptionCard
                    icon={Users}
                    title="Productividad por usuario"
                    description={`${byAssignee.length} usuarios con tickets asignados`}
                    columns={[
                        { key: 'full_name', label: 'Usuario' },
                        { key: 'total', label: 'Total', align: 'right' },
                        { key: 'active', label: 'Activos', align: 'right' },
                        { key: 'resolved', label: 'Resueltos', align: 'right' },
                    ]}
                    rows={byAssignee}
                    filename={`tickets_productividad_${range.from}_${range.to}.csv`}
                >
                    <ReportTable
                        columns={[
                            { key: 'full_name', label: 'Usuario' },
                            { key: 'total', label: 'Total', align: 'right' },
                            { key: 'active', label: 'Activos', align: 'right' },
                            { key: 'resolved', label: 'Resueltos', align: 'right' },
                        ]}
                        rows={byAssignee}
                        empty="No hay tickets asignados."
                    />
                </ReportOptionCard>

                <ReportOptionCard
                    icon={Hash}
                    title="Distribución por categoría"
                    description={`${byCategory.reduce((a, c) => a + c.count, 0)} tickets clasificados`}
                    columns={[
                        { key: 'category', label: 'Categoría', render: (r) => CATEGORY_LABELS[r.category] || r.category },
                        { key: 'count', label: 'Cantidad', align: 'right' },
                    ]}
                    rows={byCategory.map((c) => ({ category: c.category, count: c.count }))}
                    filename={`tickets_categoria_${range.from}_${range.to}.csv`}
                >
                    <ReportTable
                        columns={[
                            { key: 'category', label: 'Categoría', render: (r) => CATEGORY_LABELS[r.category] || r.category },
                            { key: 'count', label: 'Cantidad', align: 'right' },
                        ]}
                        rows={byCategory.map((c) => ({ category: c.category, count: c.count }))}
                        empty="No hay tickets clasificados."
                    />
                </ReportOptionCard>
            </div>
        </ReportSection>
    );
}
