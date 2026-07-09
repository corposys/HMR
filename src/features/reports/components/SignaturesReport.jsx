import { PenLine, FileSignature, Mail } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import KPIRow from './KPIRow';
import ChartCard from './ChartCard';
import ReportTable from './ReportTable';
import ReportSection from './ReportSection';

export default function SignaturesReport({ data, loading, error, range }) {
    const byDay = data?.by_day ?? [];
    const byMonth = data?.by_month ?? [];
    const list = data?.list ?? [];
    const total = data?.total ?? 0;
    const inPeriod = data?.in_period ?? 0;
    const avgMonthly = byMonth.length > 0
        ? Math.round(byMonth.reduce((a, m) => a + m.count, 0) / byMonth.length)
        : 0;

    const kpiItems = data
        ? [
            {
                title: 'Firmas generadas',
                value: total,
                subtitle: 'Histórico total',
                icon: PenLine,
                variant: 'primary',
            },
            {
                title: 'En el período',
                value: inPeriod,
                subtitle: `${range.from} → ${range.to}`,
                icon: FileSignature,
                variant: 'success',
            },
            {
                title: 'Promedio mensual',
                value: avgMonthly,
                subtitle: 'Generadas por mes',
                icon: Mail,
                variant: 'default',
            },
        ]
        : [];

    return (
        <ReportSection loading={loading} error={error} data={data}>
            <div className="space-y-6">
                <KPIRow items={kpiItems} columns={3} />

                {byDay.length > 0 ? (
                    <ChartCard
                        title="Firmas generadas por día"
                        description={`Período ${range.from} → ${range.to}`}
                    >
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={byDay}>
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
                                    <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Firmas" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                ) : (
                    <ChartCard title="Firmas generadas por día" description="Sin actividad en el período">
                        <p className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                            No se generaron firmas en el período seleccionado.
                        </p>
                    </ChartCard>
                )}

                {byMonth.length > 0 && byMonth.length > 1 && (
                    <ChartCard
                        title="Distribución mensual"
                        description="Tendencia de generación"
                    >
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={byMonth}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="month" stroke="var(--color-text-muted)" fontSize={12} />
                                    <YAxis stroke="var(--color-text-muted)" fontSize={12} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--color-bg-elevated)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '8px',
                                            color: 'var(--color-text-primary)',
                                        }}
                                    />
                                    <Bar dataKey="count" fill="var(--color-warning)" radius={[4, 4, 0, 0]} name="Firmas / mes" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                )}

                <ChartCard
                    title="Listado completo de firmas"
                    description="Todas las firmas registradas en el sistema"
                >
                    <ReportTable
                        columns={[
                            { key: 'full_name', label: 'Nombre' },
                            { key: 'job_title', label: 'Cargo' },
                            { key: 'email', label: 'Email', render: (r) => <span className="text-[var(--color-text-muted)]">{r.email}</span> },
                            { key: 'mobile_phone', label: 'Celular', render: (r) => r.mobile_phone || '—' },
                            { key: 'extension', label: 'Extensión', render: (r) => r.extension || '—' },
                            { key: 'created_at', label: 'Generada', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString('es') : '—' },
                            { key: 'created_by_name', label: 'Por', render: (r) => r.created_by_name || '—' },
                        ]}
                        rows={list}
                        empty="No hay firmas registradas en el sistema."
                    />
                </ChartCard>
            </div>
        </ReportSection>
    );
}
