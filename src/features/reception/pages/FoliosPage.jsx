import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search, RefreshCw, AlertTriangle, DollarSign, Plus, User,
} from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import Button from '@shared/common/Button';
import Modal from '@shared/common/Modal';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import EmptyState from '@shared/common/EmptyState';
import { Card, CardHeader } from '@/components/ui/card';
import { apiFetch } from '@utils/api';
import { formatCurrency } from '@utils/formatters';
import FoliosTable from '@features/reception/components/FoliosTable';
import PaymentModal from '@features/reservations/components/PaymentModal';
import ChargeModal from '@features/reservations/components/ChargeModal';

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

    const pending = useMemo(() => filtered.filter(r => (r.balance || 0) > 0), [filtered]);
    const totalBalance = useMemo(() => {
        return filtered.reduce((sum, r) => sum + (r.balance || 0), 0);
    }, [filtered]);

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

    return (
        <PageWrapper>
            <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
                <CardHeader className="py-3 px-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex w-full sm:w-auto items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 border-blue-500/30 bg-blue-500/10 text-blue-300 shadow-sm">
                                <DollarSign className="h-3 w-3 shrink-0" />
                                <span className="hidden sm:inline">Folios</span>
                                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-white/10 text-current">
                                    {filtered.length}
                                </span>
                            </div>
                            {pending.length > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-sm">
                                    <AlertTriangle className="h-3 w-3 shrink-0" />
                                    <span className="hidden sm:inline">Pendientes</span>
                                    <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-white/10 text-current">
                                        {pending.length}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-sm">
                                <DollarSign className="h-3 w-3 shrink-0" />
                                <span className="hidden sm:inline">Balance</span>
                                <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-white/10 text-current">
                                    {formatCurrency(totalBalance)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <div className="relative flex-1 sm:flex-none">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Buscar huésped, habitación o control..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="h-8 w-full sm:w-56 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] pl-8 pr-3 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)]/50"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                                    >
                                        <span className="text-xs font-bold">&times;</span>
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={fetchReservations}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
                                title="Actualizar"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            ) : filtered.length > 0 ? (
                <FoliosTable
                    reservations={filtered}
                    onRowClick={openFolio}
                />
            ) : (
                <EmptyState title="Sin folios abiertos" description="No hay huéspedes actualmente en el hotel" />
            )}

            <Modal
                isOpen={!!selectedRes}
                onClose={closeFolio}
                title={folio ? `Folio ${folio.control_number}` : 'Detalle de Folio'}
                icon={DollarSign}
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
                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                            <User className="w-4 h-4 text-[var(--color-text-muted)]" />
                            {selectedRes.guest_name}
                            <span className="text-[var(--color-text-muted)]">· Hab. {selectedRes.room_number}</span>
                        </div>
                    )}

                    {folioLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <LoadingSpinner size="sm" />
                        </div>
                    ) : folio ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-bg-primary)]/50 p-2 text-center">
                                    <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Subtotal</p>
                                    <p className="text-sm font-bold text-[var(--color-text-secondary)]">{formatCurrency(folio.subtotal_base)}</p>
                                </div>
                                <div className="rounded-lg border border-[var(--color-border)]/50 bg-[var(--color-bg-primary)]/50 p-2 text-center">
                                    <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">IVA</p>
                                    <p className="text-sm font-bold text-[var(--color-text-secondary)]">{formatCurrency(folio.tax_iva)}</p>
                                </div>
                                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] p-2 text-center">
                                    <p className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Total</p>
                                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{formatCurrency(folio.total_amount)}</p>
                                </div>
                                <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-2 text-center">
                                    <p className="text-[10px] uppercase tracking-wide text-emerald-400">Pagado</p>
                                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(folio.total_paid)}</p>
                                </div>
                            </div>

                            <div className={`text-center py-3 rounded-lg border ${folio.balance > 0 ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'}`}>
                                <span className="text-[10px] uppercase tracking-wide">Balance</span>
                                <p className="text-lg font-bold">{formatCurrency(folio.balance)}</p>
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
