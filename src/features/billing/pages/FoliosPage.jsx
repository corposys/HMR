import { Receipt } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';

export default function FoliosPage() {
    return (
        <PageWrapper
            title="Facturación"
            subtitle="Gestión de folios y facturas"
            icon={Receipt}
        >
            <div className="flex items-center justify-center h-96 text-[var(--color-text-muted)]">
                <div className="text-center">
                    <Receipt className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">Módulo en desarrollo</p>
                    <p className="text-sm mt-1">Facturación y folios — próximamente</p>
                </div>
            </div>
        </PageWrapper>
    );
}