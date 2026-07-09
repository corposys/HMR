import { FileDown, FileText } from 'lucide-react';
import Button from '@shared/common/Button';
import { useToast } from '@context/ToastContext';
import { exportToCSV } from './csvUtils';

export default function ExportButton({ rows, filename, columns, label = 'Exportar CSV' }) {
    const { showToast } = useToast();

    const handleExport = () => {
        try {
            const ok = exportToCSV(rows, filename, columns);
            if (ok) {
                showToast({ type: 'success', title: 'Exportado', message: 'El archivo CSV se descargó correctamente.' });
            } else {
                showToast({ type: 'warning', title: 'Sin datos', message: 'No hay datos para exportar.' });
            }
        } catch {
            showToast({ type: 'error', title: 'Error', message: 'No se pudo exportar el archivo.' });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const disabled = !rows || rows.length === 0;

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="secondary"
                icon={FileText}
                onClick={handlePrint}
                disabled={disabled}
                size="sm"
            >
                Imprimir
            </Button>
            <Button
                variant="primary"
                icon={FileDown}
                onClick={handleExport}
                disabled={disabled}
                size="sm"
            >
                {label}
            </Button>
        </div>
    );
}
