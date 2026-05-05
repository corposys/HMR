import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Receipt, Search, BedDouble, User, DollarSign, Plus, ArrowRight,
    RefreshCw, AlertTriangle, CheckCircle, Clock,
} from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';
import Input from '@shared/common/Input';
import Modal from '@shared/common/Modal';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import { apiFetch } from '@utils/api';
import PaymentModal from '@features/reservations/components/PaymentModal';
import ChargeModal from '@features/reservations/components/ChargeModal';
import { formatDate, formatCurrency } from '@utils/formatters';

export default function FoliosPage() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedRes, setSelectedRes] = useState(null);
    const [folio, setFolio] = useState(null);
    const [folioLoading, setFolioLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showCharge, setShowCharge] = useState(false);

    const fetchReservations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/api/reception/reservations?status=checked_in&limit=100');
            setReservations(data.reservations || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const filtered = useMemo(() => {
        if (!search.trim()) return reservations;
        const q = search.toLowerCase();
        return reservations.filter(r =>
            r.guest_name?.toLowerCase().includes(q) ||
            r.room_number?.toLowerCase().includes(q) ||
            r.control_number?.toLowerCase().includes(q)
        );
    }, [reservations, search]);

    const openFolio = async (res) => {
        setSelectedRes(res);
        setFolioLoading(true);
        try {
            const data = await apiFetch(`/api/reception/folios/${res.id}`);
            setFolio(data.folio || null);
        } catch {
            setFolio(null);
        } finally {
            setFolioLoading(false);
        }
    };

    const closeFolio = () => {
        setSelectedRes(null);
        setFolio(null);
    };

    const handlePaymentCreated = () => {
        setShowPayment(false);
        if (selectedRes) openFolio(selectedRes);
        fetchReservations();
    };

    const handleChargeCreated = () => {
        setShowCharge(false);
        if (selectedRes) openFolio(selectedRes);
        fetchReservations();
    };

    const totalBalance = useMemo(() => {
        return filtered.reduce((sum, r) => sum + (r.balance || 0), 0);
    }, [filtered]);

    return (
        <PageWrapper title="Gestión de Folios" subtitle="Cuentas huésped, cargos y pagos" icon={Receipt}>
            <div className="space-y-4">
                {/* Stats */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                        <Receipt className="w-4 h-4 text-[var(--color-primary)]" />
                        <span className="text-sm font-bold">{filtered.length}</span>
                        <span className="text-xs text-[var(--color-text-muted)]">folios abiertos</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <DollarSign className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-bold">{formatCurrency(totalBalance)}</span>
                        <span className="text-xs text-amber-400/70">balance total</span>
                    </div>
                    <div className="ml-auto">
                        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchReservations} title="Actualizar" />
                    </div>
                </div>

                {/* Search */}
                <div className="max-w-md">
                    <Input
                        icon={Search}
                        placeholder="Buscar por huésped, habitación o control..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {filtered.map(res => (
                            <FolioCard
                                key={res.id}
                                reservation={res}
                                onClick={() => openFolio(res)}
                            />
                        ))}

                        {filtered.length === 0 && (
                            <div className="col-span-full flex items-center justify-center h-64 text-[var(--color-text-muted)]">
                                <div className="text-center">
                                    <p className="text-lg font-medium">Sin folios abiertos</p>
                                    <p className="text-sm mt-1">No hay huéspedes actualmente en el hotel</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Folio detail modal */}
            <Modal
                isOpen={!!selectedRes}
                onClose={closeFolio}
                title={folio ? `Folio ${folio.control_number}` : 'Detalle de Folio'}
                icon={Receipt}
                size="lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" size="sm" icon={Plus} onClick={() => setShowCharge(true)}>
                            Cargo extra
                        </Button>
                        <Button variant="primary" size="sm" icon={DollarSign} onClick={() => setShowPayment(true)}>
                            Registrar pago
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {selectedRes && (
                        <div className="flex items-center gap-3">
                            <Badge variant="success">En estancia</Badge>
                            <span className="text-sm text-[var(--color-text-muted)]">
                                {selectedRes.guest_name} · Hab. {selectedRes.room_number}
                            </span>
                        </div>
                    )}

                    {folioLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <LoadingSpinner size="sm" />
                        </div>
                    ) : folio ? (
                        <div className="space-y-4">
                            {/* Financial summary */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <StatBox label="Subtotal" value={formatCurrency(folio.subtotal_base)} />
                                <StatBox label="IVA" value={formatCurrency(folio.tax_iva)} />
                                <StatBox label="Total" value={formatCurrency(folio.total_amount)} highlight />
                                <StatBox label="Pagado" value={formatCurrency(folio.total_paid)} success />
                            </div>

                            <div className={`text-center py-2 rounded-lg border ${folio.balance > 0 ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                                <span className="text-xs uppercase tracking-wide">Balance</span>
                                <p className="text-xl font-bold">{formatCurrency(folio.balance)}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-[var(--color-text-muted)]">No se pudo cargar el folio.</div>
                    )}
                </div>
            </Modal>

            {selectedRes && (
                <>
                    <PaymentModal
                        isOpen={showPayment}
                        onClose={() => setShowPayment(false)}
                        reservationId={selectedRes.id}
                        onPaymentCreated={handlePaymentCreated}
                    />
                    <ChargeModal
                        isOpen={showCharge}
                        onClose={() => setShowCharge(false)}
                        reservationId={selectedRes.id}
                        onChargeCreated={handleChargeCreated}
                    />
                </>
            )}
        </PageWrapper>
    );
}

function FolioCard({ reservation, onClick }) {
    const hasBalance = (reservation.balance || 0) > 0;

    return (
        <button
            onClick={onClick}
            className="text-left rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-3 hover:border-[var(--color-border-hover)] transition-colors w-full"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">{reservation.control_number || '—'}</span>
                </div>
                <Badge variant={hasBalance ? 'warning' : 'success'}>
                    {hasBalance ? 'Pendiente' : 'Pagado'}
                </Badge>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                    <User className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    {reservation.guest_name}
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <BedDouble className="w-3.5 h-3.5" />
                    Hab. {reservation.room_number}
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-muted)]">Balance:</span>
                    <span className={`font-bold ${hasBalance ? 'text-red-400' : 'text-emerald-400'}`}>
                        {formatCurrency(reservation.balance)}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/50">
                <span className="text-[10px] text-[var(--color-text-muted)]">
                    {formatDate(reservation.check_in_date)} → {formatDate(reservation.check_out_date)}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
            </div>
        </button>
    );
}

function StatBox({ label, value, highlight, success }) {
    return (
        <div className={`rounded-lg border p-2 text-center ${
            highlight
                ? 'bg-[var(--color-bg-tertiary)] border-[var(--color-border)]'
                : success
                    ? 'bg-emerald-500/5 border-emerald-500/10'
                    : 'bg-[var(--color-bg-primary)]/50 border-[var(--color-border)]/50'
        }`}>
            <p className={`text-[10px] uppercase tracking-wide ${success ? 'text-emerald-400' : 'text-[var(--color-text-muted)]'}`}>{label}</p>
            <p className={`text-sm font-bold ${highlight ? 'text-[var(--color-text-primary)]' : success ? 'text-emerald-400' : 'text-[var(--color-text-secondary)]'}`}>{value}</p>
        </div>
    );
}
