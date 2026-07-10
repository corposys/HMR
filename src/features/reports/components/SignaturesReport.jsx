import { PenLine, FileSignature } from 'lucide-react';
import ReportSection from './ReportSection';
import ReportTable from './ReportTable';
import ReportOptionCard from './ReportOptionCard';

export default function SignaturesReport({ data, loading, error, range }) {
    const list = data?.list ?? [];
    const total = data?.total ?? 0;
    const inPeriod = data?.in_period ?? 0;

    return (
        <ReportSection loading={loading} error={error} data={data}>
            <div className="space-y-4">
                <ReportOptionCard
                    icon={PenLine}
                    title="Listado de firmas"
                    description={`${total} firmas registradas en el sistema`}
                    columns={[
                        { key: 'full_name', label: 'Nombre' },
                        { key: 'job_title', label: 'Cargo' },
                        { key: 'email', label: 'Email' },
                        { key: 'mobile_phone', label: 'Celular', render: (r) => r.mobile_phone || '—' },
                        { key: 'extension', label: 'Extensión', render: (r) => r.extension || '—' },
                        { key: 'created_at', label: 'Generada', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString('es') : '—' },
                    ]}
                    rows={list}
                    filename={`firmas_listado_${range.from}_${range.to}.csv`}
                >
                    <ReportTable
                        columns={[
                            { key: 'full_name', label: 'Nombre' },
                            { key: 'job_title', label: 'Cargo' },
                            { key: 'email', label: 'Email' },
                            { key: 'mobile_phone', label: 'Celular', render: (r) => r.mobile_phone || '—' },
                            { key: 'extension', label: 'Extensión', render: (r) => r.extension || '—' },
                            { key: 'created_at', label: 'Generada', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString('es') : '—' },
                        ]}
                        rows={list}
                        empty="No hay firmas registradas."
                    />
                </ReportOptionCard>

                <ReportOptionCard
                    icon={FileSignature}
                    title="Resumen del período"
                    description={`${inPeriod} firmas generadas (${range.from} → ${range.to})`}
                    columns={[
                        { key: 'label', label: 'Indicador' },
                        { key: 'value', label: 'Valor' },
                    ]}
                    rows={[
                        { label: 'Total histórico', value: total },
                        { label: 'En el período', value: inPeriod },
                    ]}
                    filename={`firmas_resumen_${range.from}_${range.to}.csv`}
                >
                    <ReportTable
                        columns={[
                            { key: 'label', label: 'Indicador' },
                            { key: 'value', label: 'Valor' },
                        ]}
                        rows={[
                            { label: 'Total histórico', value: total },
                            { label: 'Generadas en el período', value: inPeriod },
                        ]}
                    />
                </ReportOptionCard>
            </div>
        </ReportSection>
    );
}
