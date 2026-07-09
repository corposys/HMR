import { Ticket, Clock, CheckCircle2, AlertOctagon } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell,
    AreaChart, Area,
} from 'recharts';
import KPIRow from './KPIRow';
import ChartCard from './ChartCard';
import ReportTable from './ReportTable';
import ReportSection from './ReportSection';

const STATUS_COLORS = {
    open: '#ef4444',
    in_progress: '#f59e0b',
    resolved: '#10b981',
    closed: '#6b7280',
};

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
    const statusData = data?.by_status
        ? ['open', 'in_progress', 'resolved', 'closed'].map((s) => ({
            name: STATUS_LABELS[s],
            value: data.by_status.find((b) => b.status === s)?.count || 0,
            key: s,
        }))
        : [];

    const priorityData = data?.by_priority
        ? data.by_priority.map((p) => ({
            name: PRIORITY_LABELS[p.priority] || p.priority,
            Cantidad: p.count,
            color: PRIORITY_COLORS[p.priority] || '#6b7280',
        }))
        : [];

    const categoryData = data?.by_category
        ? data.by_category.map((c) => ({
            name: CATEGORY_LABELS[c.category] || c.category,
            Tickets: c.count,
        }))
        : [];

    const backlog = data?.backlog ?? [];
    const backlogCount = backlog.length;
    const totalInPeriod = data?.by_status?.reduce((a, s) => a + s.count, 0) || 0;
    const resolvedInPeriod = data?.resolved_count_in_period || 0;
    const avgHours = data?.avg_resolution_hours || 0;
    const createdVsResolved = data?.created_vs_resolved_by_day || [];
    const byAssignee = data?.by_assignee || [];

    const kpiItems = data && data.by_status && data.by_priority && data.by_category
        ? [
            {
                title: 'Tickets del período',
                value: totalInPeriod,
                icon: Ticket,
                variant: 'primary',
            },
            {
                title: 'Resueltos',
                value: resolvedInPeriod,
                subtitle: totalInPeriod > 0 ? `${Math.round((resolvedInPeriod / totalInPeriod) * 100)}% del total` : '—',
                icon: CheckCircle2,
                variant: 'success',
            },
            {
                title: 'Backlog abierto',
                value: backlogCount,
                subtitle: 'Pendientes de atención',
                icon: AlertOctagon,
                variant: backlogCount > 5 ? 'danger' : 'warning',
            },
            {
                title: 'Tiempo promedio de resolución',
                value: `${avgHours}h`,
                subtitle: 'Tickets resueltos en el período',
                icon: Clock,
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
                        title="Tickets por estado"
                        description="Distribución del período"
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
                        title="Tickets por prioridad"
                        description="Distribución del período"
                    >
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={priorityData}>
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
                                    <Bar dataKey="Cantidad" radius={[4, 4, 0, 0]}>
                                        {priorityData.map((entry, idx) => (
                                            <Cell key={idx} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

                <ChartCard
                    title="Creados vs Resueltos"
                    description={`Evolución diaria (${range.from} → ${range.to})`}
                >
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={createdVsResolved}>
                                <defs>
                                    <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="day" stroke="var(--color-text-muted)" fontSize={11} />
                                <YAxis stroke="var(--color-text-muted)" fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--color-bg-elevated)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        color: 'var(--color-text-primary)',
                                    }}
                                />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="created"
                                    stroke="#3b82f6"
                                    fill="url(#colorCreated)"
                                    name="Creados"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="resolved"
                                    stroke="#10b981"
                                    fill="url(#colorResolved)"
                                    name="Resueltos"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </ChartCard>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Tickets por categoría" description="Distribución del período">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData}>
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
                                    <Bar dataKey="Tickets" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>

                    <ChartCard
                        title="Productividad por asignado"
                        description="Tickets gestionados"
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
                    </ChartCard>
                </div>

                <ChartCard
                    title="Backlog actual"
                    description="Tickets abiertos o en progreso (top 50)"
                >
                    <ReportTable
                        columns={[
                            { key: 'ticket_number', label: 'Nº', mono: true },
                            { key: 'title', label: 'Título' },
                            {
                                key: 'priority',
                                label: 'Prioridad',
                                render: (r) => (
                                    <span style={{ color: PRIORITY_COLORS[r.priority] }} className="font-medium">
                                        {PRIORITY_LABELS[r.priority] || r.priority}
                                    </span>
                                ),
                            },
                            {
                                key: 'status',
                                label: 'Estado',
                                render: (r) => STATUS_LABELS[r.status] || r.status,
                            },
                            { key: 'category', label: 'Categoría', render: (r) => CATEGORY_LABELS[r.category] || r.category },
                            { key: 'assigned_name', label: 'Asignado', render: (r) => r.assigned_name || '—' },
                            { key: 'comment_count', label: 'Comentarios', align: 'right' },
                            { key: 'created_at', label: 'Creado', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString('es') : '—' },
                        ]}
                        rows={backlog}
                        empty="No hay tickets en el backlog."
                    />
                </ChartCard>
            </div>
        </ReportSection>
    );
}
