import { useState } from 'react';
import { FileText, CheckCircle, XCircle, Eye } from 'lucide-react';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';
import { apiFetch } from '@utils/api';
import { usePermissions } from '@hooks/usePermissions';
import { formatCurrency } from '@utils/formatters';

export default function FolioView({ folio, onUpdate }) {
    const { can } = usePermissions();
    const [isClosing, setIsClosing] = useState(false);

    const isOpen = folio.status === 'open';
    const isClosed = folio.status === 'closed';

    async function handleCloseFolio() {
        if (!confirm('¿Cerrar este folio? Esta acción no se puede deshacer.')) return;
        setIsClosing(true);
        try {
            await apiFetch(`/api/reception/folios/${folio.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'closed' }),
            });
            onUpdate?.();
        } catch (err) {
            alert(err.message || 'Error al cerrar folio');
        } finally {
            setIsClosing(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-[var(--color-primary)]" />
                    <div>
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                            Folio {folio.control_number}
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)]">
                            {isOpen ? 'Abierto' : isClosed ? 'Cerrado' : 'Anulado'}
                        </p>
                    </div>
                </div>
                <Badge variant={isOpen ? 'success' : isClosed ? 'primary' : 'danger'}>
                    {isOpen ? 'Abierto' : isClosed ? 'Cerrado' : 'Anulado'}
                </Badge>
            </div>

            <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Subtotal Base</span>
                    <span className="text-[var(--color-text-primary)]">{formatCurrency(folio.subtotal_base)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">IVA</span>
                    <span className="text-[var(--color-text-primary)]">{formatCurrency(folio.tax_iva)}</span>
                </div>
                {Number(folio.tax_igtf) > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">IGTF</span>
                        <span className="text-[var(--color-text-primary)]">{formatCurrency(folio.tax_igtf)}</span>
                    </div>
                )}
                <div className="border-t border-[var(--color-border)] pt-2 flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span className="text-[var(--color-text-primary)]">{formatCurrency(folio.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-muted)]">Pagado</span>
                    <span className="text-[var(--color-success)]">{formatCurrency(folio.total_paid)}</span>
                </div>
                <div className="border-t border-[var(--color-border)] pt-2 flex justify-between font-bold">
                    <span>Balance</span>
                    <span className={Number(folio.balance) > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}>
                        {formatCurrency(folio.balance)}
                    </span>
                </div>
            </div>

            {(folio.fiscal_name || folio.fiscal_id || folio.fiscal_address) && (
                <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4 space-y-1">
                    <p className="text-xs font-medium text-[var(--color-text-muted)]">Datos Fiscales</p>
                    {folio.fiscal_name && <p className="text-sm">{folio.fiscal_name}</p>}
                    {folio.fiscal_id && <p className="text-sm text-[var(--color-text-secondary)]">RIF: {folio.fiscal_id}</p>}
                    {folio.fiscal_address && <p className="text-xs text-[var(--color-text-muted)]">{folio.fiscal_address}</p>}
                </div>
            )}

            {isOpen && can('reception', 'close_folio') && (
                <Button
                    variant="primary"
                    onClick={handleCloseFolio}
                    loading={isClosing}
                    className="w-full"
                >
                    Cerrar Folio
                </Button>
            )}
        </div>
    );
}