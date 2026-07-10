import { useState } from 'react';
import { FileDown, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '@shared/common/Button';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '@shared/common/Card';
import { exportToCSV } from './csvUtils';

export default function ReportOptionCard({
    icon: Icon,
    title,
    description,
    columns,
    rows,
    filename,
    children,
}) {
    const [expanded, setExpanded] = useState(false);
    const hasData = rows && rows.length > 0;

    const handleExportCSV = () => {
        if (!hasData) return;
        exportToCSV(rows, filename, columns);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <Card padding="md" className={`transition-all duration-200 ${expanded ? 'ring-1 ring-[var(--color-primary)]/30' : 'hover:border-[var(--color-border-hover)]'}`}>
            <CardHeader>
                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-start gap-3 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
                    >
                        {Icon && (
                            <div className="mt-0.5 w-9 h-9 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
                                <Icon className="w-4 h-4 text-[var(--color-primary)]" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
                            {description && (
                                <CardDescription className="text-xs mt-0.5 line-clamp-1">{description}</CardDescription>
                            )}
                        </div>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                        {expanded && hasData && (
                            <>
                                <Button variant="secondary" icon={FileText} size="sm" onClick={handlePrint}>
                                    Imprimir
                                </Button>
                                <Button variant="primary" icon={FileDown} size="sm" onClick={handleExportCSV}>
                                    CSV
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            icon={expanded ? ChevronUp : ChevronDown}
                            size="sm"
                            className="!p-1.5 h-7 w-7"
                            onClick={() => setExpanded(!expanded)}
                        />
                    </div>
                </div>
            </CardHeader>

            {expanded && (
                <CardContent>
                    {hasData ? (
                        children
                    ) : (
                        <p className="text-center py-6 text-sm text-[var(--color-text-muted)]">
                            No hay datos disponibles para este reporte.
                        </p>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
