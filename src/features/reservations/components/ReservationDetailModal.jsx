import { useState, useEffect } from 'react';
import { RefreshCw, User, BedDouble, Calendar, Plus, FileText, LogIn, LogOut, XCircle, BadgeAlert } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';
import { usePermissions } from '@hooks/usePermissions';
import { apiFetch } from '@utils/api';
import PaymentModal from '@features/reservations/components/PaymentModal';
import ChargeModal from '@features/reservations/components/ChargeModal';
import FolioView from '@features/reservations/components/FolioView';
import { RESERVATION_STATUS_LABELS, RESERVATION_SOURCES, PAYMENT_METHODS, CHARGE_TYPES } from '@utils/constants';
import { formatDate, formatCurrency } from '@utils/formatters';

const STATUS_BADGE_VARIANT = {
    reserved: 'info',
    checked_in: 'success',
    checked_out: 'primary',
    no_show: 'warning',
    cancelled: 'danger',
};

export default function ReservationDetailModal({ reservationId, isOpen, onClose, onCheckin, onCheckout, onRefresh }) {
    const [reservation, setReservation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('detail');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showChargeModal, setShowChargeModal] = useState(false);
    const { can } = usePermissions();

    useEffect(() => {
        if (!isOpen || !reservationId) return;
        setActiveTab('detail');
        loadReservation();
    }, [isOpen, reservationId]);

    async function loadReservation() {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiFetch(`/api/reception/reservations/${reservationId}`);
            setReservation(data.reservation || data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCancelReservation() {
        if (!confirm('¿Cancelar esta reserva?')) return;
        try {
            await apiFetch(`/api/reception/reservations/${reservationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' }),
            });
            await loadReservation();
            onRefresh?.();
        } catch (err) {
            alert(err.message || 'Error al cancelar');
        }
    }

    if (!isOpen) return null;

    const r = reservation;
    const folio = r?.folio;
    const payments = r?.payments || [];
    const charges = r?.charges || [];
    const status = r?.status;

    const tabs = [
        { key: 'detail', label: 'Detalle' },
        { key: 'charges', label: `Cargos (${charges.length})` },
        { key: 'payments', label: `Pagos (${payments.length})` },
    ];
    if (folio) tabs.push({ key: 'folio', label: 'Folio' });

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`Reserva #${reservationId}`}
                icon={Calendar}
                size="xl"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8 text-[var(--color-danger)]">{error}</div>
                ) : r ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Badge variant={STATUS_BADGE_VARIANT[status] || 'primary'}>
                                    {RESERVATION_STATUS_LABELS[status] || status}
                                </Badge>
                                {r.control_number && (
                                    <span className="text-sm text-[var(--color-text-muted)]">{r.control_number}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {status === 'reserved' && can('reception', 'write') && (
                                    <>
                                        <Button size="sm" variant="primary" onClick={() => onCheckin(reservationId)} icon={LogIn}>
                                            Check-in
                                        </Button>
                                        <Button size="sm" variant="danger" onClick={handleCancelReservation} icon={XCircle}>
                                            Cancelar
                                        </Button>
                                    </>
                                )}
                                {status === 'checked_in' && can('reception', 'write') && (
                                    <Button size="sm" variant="primary" onClick={() => onCheckout(reservationId)} icon={LogOut}>
                                        Check-out
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition-colors ${
                                        activeTab === tab.key
                                            ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] bg-[var(--color-bg-elevated)]'
                                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'detail' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <DetailRow icon={User} label="Huésped" value={r.guest_name} />
                                    <DetailRow icon={BadgeAlert} label="Documento" value={`${r.guest_document_type || ''}${r.guest_document_number || ''}`} />
                                    <DetailRow icon={BedDouble} label="Habitación" value={r.room_number} />
                                    <DetailRow icon={FileText} label="Plan" value={r.plan_name || 'Sin plan'} />
                                    <DetailRow icon={Calendar} label="Check-in" value={formatDate(r.check_in_date)} />
                                    <DetailRow icon={Calendar} label="Check-out" value={r.check_out_date ? formatDate(r.check_out_date) : '—'} />
                                    <DetailRow label="Huéspedes" value={r.num_guests} />
                                    <DetailRow label="Origen" value={RESERVATION_SOURCES[r.source] || r.source} />
                                    {r.bracelet_color && <DetailRow label="Brazalete" value={r.bracelet_color} />}
                                    {(r.early_checkin || r.late_checkout) && (
                                        <div className="md:col-span-2 flex gap-3">
                                            {r.early_checkin && <Badge variant="warning">Early Check-in</Badge>}
                                            {r.late_checkout && <Badge variant="warning">Late Check-out</Badge>}
                                        </div>
                                    )}
                                    {r.notes && (
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-[var(--color-text-muted)] mb-1">Notas</p>
                                            <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] rounded-lg p-3">{r.notes}</p>
                                        </div>
                                    )}
                                </div>
                                {r.guest_phone && (
                                    <DetailRow label="Teléfono" value={r.guest_phone} />
                                )}
                            </div>
                        )}

                        {activeTab === 'charges' && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium text-[var(--color-text-primary)]">Cargos</h3>
                                    {(status === 'reserved' || status === 'checked_in') && can('reception', 'write') && (
                                        <Button size="sm" icon={Plus} onClick={() => setShowChargeModal(true)}>
                                            Agregar Cargo
                                        </Button>
                                    )}
                                </div>
                                {charges.length === 0 ? (
                                    <p className="text-sm text-[var(--color-text-muted)] text-center py-6">Sin cargos registrados</p>
                                ) : (
                                    <div className="space-y-2">
                                        {charges.map((charge) => (
                                            <div key={charge.id} className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                                <div>
                                                    <p className="text-sm font-medium">{charge.concept}</p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">
                                                        {CHARGE_TYPES[charge.charge_type] || charge.charge_type}
                                                        {charge.quantity > 1 ? ` × ${charge.quantity}` : ''}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold">{formatCurrency(charge.total_usd)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium text-[var(--color-text-primary)]">Pagos</h3>
                                    {(status === 'reserved' || status === 'checked_in') && can('reception', 'write') && (
                                        <Button size="sm" icon={Plus} onClick={() => setShowPaymentModal(true)}>
                                            Registrar Pago
                                        </Button>
                                    )}
                                </div>
                                {payments.length === 0 ? (
                                    <p className="text-sm text-[var(--color-text-muted)] text-center py-6">Sin pagos registrados</p>
                                ) : (
                                    <div className="space-y-2">
                                        {payments.map((payment) => (
                                            <div key={payment.id} className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                                <div>
                                                    <p className="text-sm font-medium">{PAYMENT_METHODS[payment.payment_method] || payment.payment_method}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant={payment.status === 'verified' ? 'success' : payment.status === 'rejected' ? 'danger' : 'warning'}>
                                                            {payment.status === 'verified' ? 'Verificado' : payment.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                                                        </Badge>
                                                        {payment.igtf_applied && (
                                                            <span className="text-xs text-[var(--color-warning)]">+IGTF</span>
                                                        )}
                                                        {payment.reference_number && (
                                                            <span className="text-xs text-[var(--color-text-muted)]">Ref: {payment.reference_number}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">{formatDate(payment.created_at)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold">{formatCurrency(payment.amount_usd)}</p>
                                                    {payment.amount_ves && (
                                                        <p className="text-xs text-[var(--color-text-muted)]">Bs {Number(payment.amount_ves).toLocaleString('es-VE')}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'folio' && folio && (
                            <FolioView folio={folio} onUpdate={() => { loadReservation(); onRefresh?.(); }} />
                        )}
                    </div>
                ) : null}
            </Modal>

            {showPaymentModal && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    reservationId={reservationId}
                    onPaymentCreated={() => { loadReservation(); onRefresh?.(); }}
                />
            )}

            {showChargeModal && (
                <ChargeModal
                    isOpen={showChargeModal}
                    onClose={() => setShowChargeModal(false)}
                    reservationId={reservationId}
                    onChargeCreated={() => { loadReservation(); onRefresh?.(); }}
                />
            )}
        </>
    );
}

function DetailRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-2">
            {Icon && <Icon className="w-4 h-4 text-[var(--color-text-muted)] mt-0.5 shrink-0" />}
            <div>
                <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                <p className="text-sm text-[var(--color-text-primary)]">{value || '—'}</p>
            </div>
        </div>
    );
}