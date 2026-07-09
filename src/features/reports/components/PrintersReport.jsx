import { Printer, AlertTriangle, Boxes, ArrowDownUp } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell,
} from 'recharts';
import KPIRow from './KPIRow';
import ChartCard from './ChartCard';
import ReportTable from './ReportTable';
import ReportSection from './ReportSection';

const STATUS_COLORS = {
    operational: '#10b981',
    maintenance: '#f59e0b',
    out_of_service: '#ef4444',
};

const SEGMENT_LABELS = {
    hotel: 'Hotel',
    corpo: 'Corporativo',
};

const STATUS_LABELS = {
    operational: 'Operativas',
    maintenance: 'Mantenimiento',
    out_of_service: 'Fuera de servicio',
};

const OWNERSHIP_LABELS = {
    propia: 'Propia',
    alquilada: 'Alquilada',
};

export default function PrintersReport({ data, loading, error, range }) {
    const statusData = data?.by_segment_status
        ? Object.entries(
            data.by_segment_status.reduce((acc, row) => {
                if (!acc[row.status]) acc[row.status] = { name: STATUS_LABELS[row.status] || row.status, total: 0 };
                acc[row.status].total += row.count;
                return acc;
            }, {})
          ).map(([k, v]) => ({ key: k, ...v }))
        : [];

    const segmentData = data?.by_segment_status
        ? [
            { name: 'Hotel', value: data.by_segment_status.filter((r) => r.segment === 'hotel').reduce((a, r) => a + r.count, 0) },
            { name: 'Corporativo', value: data.by_segment_status.filter((r) => r.segment === 'corpo').reduce((a, r) => a + r.count, 0) },
          ]
        : [];

    const ownershipData = data?.by_ownership
        ? data.by_ownership.map((o) => ({ name: OWNERSHIP_LABELS[o.ownership] || o.ownership, Cantidad: o.count }))
        : [];

    const txSummary = data?.transactions_summary || [];
    const totalIn = txSummary.filter((t) => t.type === 'in').reduce((a, t) => a + t.total_qty, 0);
    const totalOut = txSummary.filter((t) => t.type === 'out').reduce((a, t) => a + t.total_qty, 0);

    const tonersList = data?.toners ?? [];
    const tonerLowStockCount = data?.toner_low_stock_count ?? 0;
    const transactionsRecent = data?.transactions_recent ?? [];

    const kpiItems = data && data.by_segment_status && data.by_ownership
        ? [
            {
                title: 'Impresoras totales',
                value: segmentData.reduce((a, s) => a + s.value, 0),
                subtitle: `${segmentData[0]?.value || 0} hotel · ${segmentData[1]?.value || 0} corporativo`,
                icon: Printer,
                variant: 'primary',
            },
            {
                title: 'Operativas',
                value: statusData.find((s) => s.key === 'operational')?.total || 0,
                subtitle: 'En funcionamiento',
                icon: Printer,
                variant: 'success',
            },
            {
                title: 'Stock de tóners',
                value: tonersList.reduce((a, t) => a + t.total_stock, 0),
                subtitle: `${tonerLowStockCount} modelos con stock bajo`,
                icon: Boxes,
                variant: tonerLowStockCount > 0 ? 'warning' : 'default',
            },
            {
                title: 'Movimientos del período',
                value: totalIn + totalOut,
                subtitle: `↑ ${totalIn} entradas · ↓ ${totalOut} salidas`,
                icon: ArrowDownUp,
                variant: 'default',
            },
        ]
        : [];

    return (
        <ReportSection loading={loading} error={error} data={data}>
            <div className="space-y-6">
                <KPIRow items={kpiItems} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <ChartCard title="Distribución por estado" description="Estado actual de las impresoras">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={85}
                                        dataKey="total"
                                        label={({ name, total }) => `${name}: ${total}`}
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

                    <ChartCard title="Por segmento" description="Hotel vs Corporativo">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={segmentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={85}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                        labelLine={false}
                                    >
                                        <Cell fill="var(--color-primary)" />
                                        <Cell fill="#6366f1" />
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

                    <ChartCard title="Propiedad" description="Propias vs alquiladas">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ownershipData}>
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
                                    <Bar dataKey="Cantidad" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </ChartCard>
                </div>

                <ChartCard
                    title="Inventario de tóners"
                    description="Stock actual por modelo"
                >
                    <ReportTable
                        columns={[
                            { key: 'model_name', label: 'Modelo' },
                            { key: 'color', label: 'Color' },
                            { key: 'stock_hotel', label: 'Stock Hotel', align: 'right' },
                            { key: 'stock_corpo', label: 'Stock Corpo', align: 'right' },
                            {
                                key: 'total_stock',
                                label: 'Total',
                                align: 'right',
                                render: (r) => (
                                    <span className={r.low_stock ? 'text-[var(--color-danger)] font-semibold' : 'font-semibold'}>
                                        {r.total_stock}
                                        {r.low_stock && ' ⚠'}
                                    </span>
                                ),
                            },
                        ]}
                        rows={tonersList}
                        empty="No hay tóners registrados."
                    />
                </ChartCard>

                <ChartCard
                    title="Transacciones del período"
                    description={`Movimientos de stock (${range.from} → ${range.to})`}
                >
                    <ReportTable
                        columns={[
                            { key: 'created_at', label: 'Fecha', render: (r) => r.created_at ? new Date(r.created_at).toLocaleString('es') : '—' },
                            {
                                key: 'type',
                                label: 'Tipo',
                                render: (r) => (
                                    <span className={r.type === 'in' ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}>
                                        {r.type === 'in' ? '↑ Entrada' : '↓ Salida'}
                                    </span>
                                ),
                            },
                            { key: 'toner_model', label: 'Tóner' },
                            { key: 'color', label: 'Color' },
                            { key: 'segment', label: 'Segmento', render: (r) => SEGMENT_LABELS[r.segment] || r.segment },
                            { key: 'quantity', label: 'Cantidad', align: 'right' },
                            { key: 'printer_location', label: 'Impresora', render: (r) => r.printer_brand ? `${r.printer_brand} ${r.printer_model} · ${r.printer_location || '—'}` : '—' },
                            { key: 'user_name', label: 'Usuario' },
                        ]}
                        rows={transactionsRecent}
                        empty="No hay transacciones en el período."
                    />
                </ChartCard>
            </div>
        </ReportSection>
    );
}
