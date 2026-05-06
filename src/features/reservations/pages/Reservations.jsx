import { useState, useCallback, useMemo } from 'react';
import { Plus, Search, RefreshCw, X, Calendar, Users, LogIn, Home, Calculator } from 'lucide-react';
import Button from '@shared/common/Button';
import CustomDropdown from '@shared/common/CustomDropdown';
import PageWrapper from '@shared/common/PageWrapper';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import ErrorState from '@shared/common/ErrorState';
import EmptyState from '@shared/common/EmptyState';
import Modal from '@shared/common/Modal';
import { useReservations } from '@features/reservations/hooks/useReservations';
import { usePermissions } from '@hooks/usePermissions';
import { apiFetch } from '@utils/api';
import ReservationCreateModal from '@features/reservations/components/ReservationCreateModal';
import ReservationDetailModal from '@features/reservations/components/ReservationDetailModal';
import ReservationTable from '@features/reservations/components/ReservationTable';
import QuoteTester from '@features/reservations/components/QuoteTester';
import { Card, CardHeader } from '@/components/ui/card';

const STATUS_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'reserved', label: 'Reservada' },
    { value: 'checked_in', label: 'Check-in' },
    { value: 'checked_out', label: 'Check-out' },
    { value: 'no_show', label: 'No Show' },
    { value: 'cancelled', label: 'Cancelada' },
];

export default function Reservations() {
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [selectedReservationId, setSelectedReservationId] = useState(null);
    const { can } = usePermissions();

    const { reservations, isLoading, error, fetchReservations, createReservation } = useReservations();

    const todayStr = new Date().toISOString().split('T')[0];

    const stats = useMemo(() => {
        const pending = reservations.filter(r => r.status === 'reserved').length;
        const inHouse = reservations.filter(r => r.status === 'checked_in').length;
        const arrivalsToday = reservations.filter(r => {
            if (!r.check_in_date) return false;
            return r.check_in_date.startsWith(todayStr) && r.status !== 'cancelled';
        }).length;
        const departuresToday = reservations.filter(r => {
            if (!r.check_out_date) return false;
            return r.check_out_date.startsWith(todayStr) && r.status === 'checked_in';
        }).length;
        return { pending, inHouse, arrivalsToday, departuresToday };
    }, [reservations, todayStr]);

    const filteredReservations = reservations.filter((r) => {
        if (statusFilter && r.status !== statusFilter) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                r.guest_name?.toLowerCase().includes(q) ||
                r.room_number?.toLowerCase().includes(q) ||
                r.control_number?.toLowerCase().includes(q) ||
                r.guest_document?.toLowerCase().includes(q) ||
                r.plan_name?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const loadReservations = useCallback((params = {}) => {
        const p = { ...params };
        if (statusFilter) p.status = statusFilter;
        fetchReservations(p);
    }, [statusFilter, fetchReservations]);

    async function handleCreateReservation(data) {
        const result = await createReservation(data);
        if (result?.success !== false) {
            await loadReservations();
        }
        return result;
    }

    async function handleCancelReservation(id) {
        if (!confirm('¿Cancelar esta reserva?')) return;
        try {
            await apiFetch(`/api/reception/reservations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' }),
            });
            await loadReservations();
        } catch (err) {
            alert(err.message || 'Error al cancelar reserva');
        }
    }

    return (
        <PageWrapper>
            <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm mb-4">
                <CardHeader className="py-3 px-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        {/* Izquierda: Estadísticas Compactas */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                    <Users className="w-3.5 h-3.5 text-[#009098]" />
                                    <span><strong className="text-[var(--color-text-primary)]">{reservations.length}</strong> total</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                    <Calendar className="w-3.5 h-3.5 text-[var(--color-warning)]" />
                                    <span><strong className="text-[var(--color-text-primary)]">{stats.pending}</strong> pend.</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                    <LogIn className="w-3.5 h-3.5 text-[var(--color-success)]" />
                                    <span><strong className="text-[var(--color-text-primary)]">{stats.arrivalsToday}</strong> hoy</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                    <Home className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                    <span><strong className="text-[var(--color-text-primary)]">{stats.inHouse}</strong> en casa</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                            <CustomDropdown
                                value={statusFilter}
                                onChange={(v) => setStatusFilter(v)}
                                options={STATUS_FILTERS}
                                placeholder="Estado"
                                className="min-w-[170px]"
                                buttonClassName="h-8"
                            />

                            <div className="relative w-full sm:w-64 h-8">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar reserva..."
                                    className="w-full h-full pl-8 pr-8 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            <Button variant="ghost" onClick={() => loadReservations()} icon={RefreshCw} className="h-8 w-8 !p-0 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/10" />

                            <Button variant="outline" icon={Calculator} size="sm" onClick={() => setShowQuoteModal(true)} className="h-8 text-xs !rounded-full !px-4 !py-2 bg-[var(--color-bg-secondary)] border-2 border-[var(--color-primary)] hover:border-[var(--color-primary-light)]">
                                Cotizar
                            </Button>

                            {can('reception', 'write') && (
                                <Button variant="register" icon={Plus} size="sm" onClick={() => setShowCreateModal(true)} className="h-8 text-xs">
                                    Nueva Reserva
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {isLoading ? (
                <LoadingSpinner />
            ) : error ? (
                <ErrorState message={error} onRetry={() => loadReservations()} />
            ) : reservations.length === 0 ? (
                <EmptyState
                    icon={Calendar}
                    title="No hay reservas"
                    description="Crea una nueva reserva para empezar."
                    actionLabel="Nueva Reserva"
                    onAction={() => setShowCreateModal(true)}
                />
            ) : filteredReservations.length === 0 ? (
                <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-16 text-center text-sm text-[var(--color-text-secondary)] shadow-sm">
                    Sin resultados para <strong>&quot;{search}&quot;</strong>
                </Card>
            ) : (
                <ReservationTable
                    reservations={filteredReservations}
                    onRowClick={(row) => setSelectedReservationId(row.id)}
                    onCancel={(row) => handleCancelReservation(row.id)}
                />
            )}

            {showCreateModal && (
                <ReservationCreateModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleCreateReservation}
                />
            )}

            {showQuoteModal && (
                <Modal
                    isOpen={showQuoteModal}
                    onClose={() => setShowQuoteModal(false)}
                    title="Cotizador Rápido"
                    icon={Calculator}
                    size="xl"
                >
                    <div className="-mt-4 -mb-4">
                        <QuoteTester />
                    </div>
                </Modal>
            )}

            {selectedReservationId && (
                <ReservationDetailModal
                    reservationId={selectedReservationId}
                    isOpen={!!selectedReservationId}
                    onClose={() => setSelectedReservationId(null)}
                    onRefresh={() => loadReservations()}
                />
            )}
        </PageWrapper>
    );
}
