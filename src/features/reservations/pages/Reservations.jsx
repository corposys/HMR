import { useState, useCallback } from 'react';
import { Plus, Search, RefreshCw, Eye, XCircle, LogIn, LogOut } from 'lucide-react';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';
import Card from '@shared/common/Card';
import CustomDropdown from '@shared/common/CustomDropdown';
import DataTable from '@shared/common/DataTable';
import PageWrapper from '@shared/common/PageWrapper';
import { useReservations } from '@features/reservations/hooks/useReservations';
import { usePermissions } from '@hooks/usePermissions';
import { apiFetch } from '@utils/api';
import ReservationCreateModal from '@features/reservations/components/ReservationCreateModal';
import ReservationDetailModal from '@features/reservations/components/ReservationDetailModal';
import CheckinWizard from '@features/reservations/components/CheckinWizard';
import { RESERVATION_STATUS_LABELS } from '@utils/constants';
import { formatDate, formatCurrency } from '@utils/formatters';

const STATUS_FILTERS = [
    { value: '', label: 'Todos' },
    { value: 'reserved', label: 'Reservada' },
    { value: 'checked_in', label: 'Check-in' },
    { value: 'checked_out', label: 'Check-out' },
    { value: 'no_show', label: 'No Show' },
    { value: 'cancelled', label: 'Cancelada' },
];

const STATUS_BADGE_VARIANT = {
    reserved: 'info',
    checked_in: 'success',
    checked_out: 'primary',
    no_show: 'warning',
    cancelled: 'danger',
};

export default function ReservationsPage() {
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedReservationId, setSelectedReservationId] = useState(null);
    const [showCheckinWizard, setShowCheckinWizard] = useState(false);
    const [checkinReservationId, setCheckinReservationId] = useState(null);
    const { can } = usePermissions();

    const { reservations, isLoading, error, fetchReservations, createReservation, checkout } = useReservations();

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

    async function handleCheckout(id) {
        try {
            await checkout(id);
            await loadReservations();
            if (selectedReservationId === id) setSelectedReservationId(id);
        } catch (err) {
            alert(err.message || 'Error al hacer check-out');
        }
    }

    const columns = [
        {
            key: 'room_number',
            header: 'Hab.',
            render: (row) => <span className="font-semibold">{row.room_number}</span>,
        },
        {
            key: 'guest_name',
            header: 'Huésped',
            render: (row) => (
                <div>
                    <div className="font-medium">{row.guest_name}</div>
                    {row.guest_document && (
                        <div className="text-xs text-[var(--color-text-muted)]">{row.guest_document}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'check_in_date',
            header: 'Check-in',
            render: (row) => formatDate(row.check_in_date),
        },
        {
            key: 'check_out_date',
            header: 'Check-out',
            render: (row) => row.check_out_date ? formatDate(row.check_out_date) : '—',
        },
        {
            key: 'plan_name',
            header: 'Plan',
            render: (row) => row.plan_name || '—',
        },
        {
            key: 'status',
            header: 'Estado',
            render: (row) => (
                <Badge variant={STATUS_BADGE_VARIANT[row.status] || 'primary'}>
                    {RESERVATION_STATUS_LABELS[row.status] || row.status}
                </Badge>
            ),
        },
        {
            key: 'balance',
            header: 'Balance',
            render: (row) => {
                if (row.folio_balance == null) return '—';
                const isPositive = Number(row.folio_balance) > 0;
                return (
                    <span className={isPositive ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}>
                        {formatCurrency(row.folio_balance)}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: '',
            render: (row) => (
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedReservationId(row.id); }} icon={Eye}>
                    </Button>
                    {row.status === 'reserved' && can('reception', 'write') && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setCheckinReservationId(row.id); setShowCheckinWizard(true); }} icon={LogIn} title="Check-in">
                        </Button>
                    )}
                    {row.status === 'checked_in' && can('reception', 'write') && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleCheckout(row.id); }} icon={LogOut} title="Check-out">
                        </Button>
                    )}
                    {row.status === 'reserved' && can('reception', 'write') && (
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleCancelReservation(row.id); }} icon={XCircle} title="Cancelar">
                        </Button>
                    )}
                </div>
            ),
        },
    ];

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Reservas</h1>
                    <p className="text-sm text-[var(--color-text-muted)]">Gestión de reservas del hotel</p>
                </div>
                {can('reception', 'write') && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => { setCheckinReservationId(null); setShowCheckinWizard(true); }} icon={LogIn}>
                            Check-in
                        </Button>
                        <Button icon={Plus} onClick={() => setShowCreateModal(true)}>Nueva Reserva</Button>
                    </div>
                )}
            </div>

            <Card>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Buscar reserva..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input pl-9"
                            />
                        </div>
                        <CustomDropdown
                            value={statusFilter}
                            onChange={(v) => { setStatusFilter(v); }}
                            options={STATUS_FILTERS}
                            placeholder="Estado"
                        />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => loadReservations()} icon={RefreshCw}>
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-[var(--color-danger)]">
                        <p>Error al cargar reservas</p>
                        <Button variant="ghost" size="sm" onClick={() => loadReservations()}>Reintentar</Button>
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        data={filteredReservations}
                        emptyText="No se encontraron reservas"
                        onRowClick={(row) => setSelectedReservationId(row.id)}
                    />
                )}
            </Card>

            {showCreateModal && (
                <ReservationCreateModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={handleCreateReservation}
                />
            )}

            {selectedReservationId && (
                <ReservationDetailModal
                    reservationId={selectedReservationId}
                    isOpen={!!selectedReservationId}
                    onClose={() => setSelectedReservationId(null)}
                    onCheckin={(id) => { setCheckinReservationId(id); setShowCheckinWizard(true); }}
                    onCheckout={handleCheckout}
                    onRefresh={() => loadReservations()}
                />
            )}

            {showCheckinWizard && (
                <CheckinWizard
                    isOpen={showCheckinWizard}
                    onClose={() => setShowCheckinWizard(false)}
                    preselectedReservationId={checkinReservationId}
                    onCheckinComplete={() => { loadReservations(); setShowCheckinWizard(false); }}
                />
            )}
        </PageWrapper>
    );
}