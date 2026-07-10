import { Printer, Boxes, ArrowDownUp } from 'lucide-react';
import ReportSection from './ReportSection';
import ReportTable from './ReportTable';
import ReportOptionCard from './ReportOptionCard';

const SEGMENT_LABELS = {
    hotel: 'Hotel',
    corpo: 'Corporativo',
};

const STATUS_LABELS = {
    operational: 'Operativas',
    maintenance: 'Mantenimiento',
    out_of_service: 'Fuera de servicio',
};

export default function PrintersReport({ data, loading, error, range }) {
    const segmentStatus = data?.by_segment_status || [];
    const tonersList = data?.toners ?? [];
    const transactions = data?.transactions_recent ?? [];

    const segmentTotal = segmentStatus.reduce((a, r) => a + r.count, 0);

    return (
        <ReportSection loading={loading} error={error} data={data}>
            <div className="space-y-4">
                <ReportOptionCard
                    icon={Printer}
                    title="Inventario por estado"
                    description={`${segmentTotal} impresoras registradas`}
                    columns={[
                        { key: 'segment', label: 'Segmento', render: (r) => SEGMENT_LABELS[r.segment] || r.segment },
                        { key: 'status', label: 'Estado', render: (r) => STATUS_LABELS[r.status] || r.status },
                        { key: 'count', label: 'Cantidad', align: 'right' },
                    ]}
                    rows={segmentStatus}
                    filename={`impresoras_inventario_${range.from}_${range.to}.csv`}
                >
                    <ReportTable
                        columns={[
                            { key: 'segment', label: 'Segmento', render: (r) => SEGMENT_LABELS[r.segment] || r.segment },
                            { key: 'status', label: 'Estado', render: (r) => STATUS_LABELS[r.status] || r.status },
                            { key: 'count', label: 'Cantidad', align: 'right' },
                        ]}
                        rows={segmentStatus}
                        empty="No hay impresoras registradas."
                    />
                </ReportOptionCard>

                <ReportOptionCard
                    icon={Boxes}
                    title="Stock de tóners"
                    description={`${tonersList.length} modelos — ${tonersList.filter(t => t.low_stock).length} con stock bajo`}
                    columns={[
                        { key: 'model_name', label: 'Modelo' },
                        { key: 'color', label: 'Color' },
                        { key: 'stock_hotel', label: 'Hotel', align: 'right' },
                        { key: 'stock_corpo', label: 'Corporativo', align: 'right' },
                        { key: 'total_stock', label: 'Total', align: 'right' },
                    ]}
                    rows={tonersList}
                    filename={`impresoras_toners_${range.from}_${range.to}.csv`}
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
                                    </span>
                                ),
                            },
                        ]}
                        rows={tonersList}
                        empty="No hay tóners registrados."
                    />
                </ReportOptionCard>

                <ReportOptionCard
                    icon={ArrowDownUp}
                    title="Movimientos de tóners"
                    description={`${transactions.length} transacciones en el período`}
                    columns={[
                        { key: 'created_at', label: 'Fecha', render: (r) => r.created_at ? new Date(r.created_at).toLocaleString('es') : '—' },
                        { key: 'type', label: 'Tipo', render: (r) => r.type === 'in' ? '↑ Entrada' : '↓ Salida' },
                        { key: 'toner_model', label: 'Tóner' },
                        { key: 'color', label: 'Color' },
                        { key: 'segment', label: 'Segmento', render: (r) => SEGMENT_LABELS[r.segment] || r.segment },
                        { key: 'quantity', label: 'Cantidad', align: 'right' },
                        { key: 'user_name', label: 'Usuario' },
                    ]}
                    rows={transactions}
                    filename={`impresoras_movimientos_${range.from}_${range.to}.csv`}
                >
                    <ReportTable
                        columns={[
                            { key: 'created_at', label: 'Fecha', render: (r) => r.created_at ? new Date(r.created_at).toLocaleString('es') : '—' },
                            { key: 'type', label: 'Tipo', render: (r) => (
                                <span className={r.type === 'in' ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}>
                                    {r.type === 'in' ? '↑ Entrada' : '↓ Salida'}
                                </span>
                            )},
                            { key: 'toner_model', label: 'Tóner' },
                            { key: 'color', label: 'Color' },
                            { key: 'segment', label: 'Segmento', render: (r) => SEGMENT_LABELS[r.segment] || r.segment },
                            { key: 'quantity', label: 'Cantidad', align: 'right' },
                            { key: 'user_name', label: 'Usuario' },
                        ]}
                        rows={transactions}
                        empty="No hay transacciones en el período."
                    />
                </ReportOptionCard>
            </div>
        </ReportSection>
    );
}
