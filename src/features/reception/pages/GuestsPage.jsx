import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, UserPlus, RefreshCw } from 'lucide-react';
import Card from '@shared/common/Card';
import Button from '@shared/common/Button';
import DataTable from '@shared/common/DataTable';
import Badge from '@shared/common/Badge';
import { useGuests, getGuestDetail } from '@features/reception/hooks/useReception';
import { usePermissions } from '@hooks/usePermissions';
import { useToast } from '@context/ToastContext';
import GuestCreateModal from '@features/reception/components/GuestCreateModal';
import GuestEditModal from '@features/reception/components/GuestEditModal';
import GuestDetailModal from '@features/reception/components/GuestDetailModal';
import { formatDate } from '@utils/formatters';

const PAGE_SIZE = 20;

export default function GuestsPage() {
    const { guests, total, isLoading, error, fetchGuests, createGuest, updateGuest } = useGuests();
    const { can } = usePermissions();
    const { showToast } = useToast();

    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [showCreate, setShowCreate] = useState(false);
    const [showExpress, setShowExpress] = useState(false);
    const [editGuest, setEditGuest] = useState(null);
    const [detailGuest, setDetailGuest] = useState(null);

    const debounceRef = useRef(null);
    const canWrite = can('guests', 'write');

    const doFetch = useCallback((searchVal, pageNum) => {
        fetchGuests({
            q: searchVal || undefined,
            limit: PAGE_SIZE,
            offset: pageNum * PAGE_SIZE,
        });
    }, [fetchGuests]);

    useEffect(() => {
        doFetch(search, page);
    }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(0);
            doFetch(search, 0);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

    const totalPages = Math.ceil(total / PAGE_SIZE);

    async function handleCreateGuest(guestData) {
        const result = await createGuest(guestData);
        if (result?.success) {
            const guest = result.guest || result;
            showToast({ title: 'Huésped creado', message: `${guest.full_name || guest.id_document_number} registrado exitosamente`, type: 'success' });
            setShowCreate(false);
            setShowExpress(false);
            return result;
        }
        return result;
    }

    async function handleEditGuest(guestId, updates) {
        const result = await updateGuest(guestId, updates);
        if (result?.success) {
            showToast({ title: 'Huésped actualizado', type: 'success' });
            setEditGuest(null);
            setDetailGuest(null);
            return result;
        }
    }

    async function handleRowClick(guest) {
        setDetailGuest(guest);
        try {
            const full = await getGuestDetail(guest.id);
            setDetailGuest(full);
        } catch {
            // keep partial data from list
        }
    }

    function handleEditFromDetail(guest) {
        setDetailGuest(null);
        setEditGuest(guest);
    }

    const columns = [
        {
            key: 'id_document_number',
            header: 'Documento',
            render: (row) => (
                <span className="font-mono text-sm">
                    {row.id_document_type}-{row.id_document_number}
                </span>
            ),
        },
        {
            key: 'full_name',
            header: 'Nombre',
            render: (row) => (
                <span className="font-medium text-[var(--color-text-primary)]">{row.full_name}</span>
            ),
        },
        {
            key: 'phone',
            header: 'Teléfono',
        },
        {
            key: 'email',
            header: 'Email',
            render: (row) => (
                <span className="text-sm text-[var(--color-text-secondary)] truncate max-w-[180px] block">
                    {row.email || '—'}
                </span>
            ),
        },
        {
            key: 'nationality',
            header: 'Nacionalidad',
            render: (row) => row.nationality || '—',
        },
        {
            key: 'reservation_count',
            header: 'Reservas',
            render: (row) => {
                const count = row.reservation_count ?? 0;
                if (count === 0) return <span className="text-[var(--color-text-muted)]">0</span>;
                return <Badge variant="primary">{count}</Badge>;
            },
        },
        {
            key: 'created_at',
            header: 'Registro',
            render: (row) => (
                <span className="text-sm text-[var(--color-text-muted)]">{formatDate(row.created_at)}</span>
            ),
        },
    ];

    return (
        <div className="py-5 w-full px-5">
            <div className="mx-auto max-w-auto space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Huéspedes</h1>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            {total} huésped{total !== 1 ? 'es' : ''} registrado{total !== 1 ? 's' : ''}
                        </p>
                    </div>
                    {canWrite && (
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" icon={UserPlus} onClick={() => setShowExpress(true)}>
                                Express
                            </Button>
                            <Button variant="primary" icon={UserPlus} onClick={() => setShowCreate(true)}>
                                Nuevo Huésped
                            </Button>
                        </div>
                    )}
                </div>

                <Card>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, documento o teléfono..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input pl-9"
                            />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => doFetch(search, page)} icon={RefreshCw} />
                    </div>

                    {error ? (
                        <div className="text-center py-12 text-[var(--color-danger)]">
                            <p>Error al cargar huéspedes</p>
                            <Button variant="ghost" size="sm" onClick={() => doFetch(search, page)}>Reintentar</Button>
                        </div>
                    ) : (
                        <>
                            <DataTable
                                columns={columns}
                                data={guests}
                                loading={isLoading}
                                emptyText="No se encontraron huéspedes"
                                onRowClick={handleRowClick}
                            />

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={page === 0}
                                            onClick={() => setPage((p) => p - 1)}
                                        >
                                            Anterior
                                        </Button>
                                        <span className="text-sm text-[var(--color-text-muted)]">
                                            Página {page + 1} de {totalPages}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={page >= totalPages - 1}
                                            onClick={() => setPage((p) => p + 1)}
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </div>

            <GuestCreateModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={handleCreateGuest}
            />

            <GuestCreateModal
                isOpen={showExpress}
                onClose={() => setShowExpress(false)}
                onCreated={handleCreateGuest}
                express
            />

            <GuestEditModal
                guest={editGuest}
                isOpen={!!editGuest}
                onClose={() => setEditGuest(null)}
                onSaved={handleEditGuest}
            />

            <GuestDetailModal
                guest={detailGuest}
                isOpen={!!detailGuest}
                onClose={() => setDetailGuest(null)}
                onEdit={canWrite ? handleEditFromDetail : undefined}
            />
        </div>
    );
}