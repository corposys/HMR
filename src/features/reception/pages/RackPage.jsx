import { useState, useEffect } from 'react';
import { LayoutGrid, List, Search, BedDouble, Users, DoorOpen, ShieldAlert, ArrowRightLeft, CalendarCheck, TrendingUp, RefreshCw } from 'lucide-react';
import StatCard from '@shared/common/StatCard';
import Card, { CardHeader, CardTitle, CardContent } from '@shared/common/Card';
import Button from '@shared/common/Button';
import CustomDropdown from '@shared/common/CustomDropdown';
import PageWrapper from '@shared/common/PageWrapper';
import { useReceptionRooms, useReceptionDashboard } from '@features/reception/hooks/useReception';
import { useBcvRate } from '@hooks/useSettings';
import BcvRateDisplay from '@features/reception/components/BcvRateDisplay';
import BlockRoomModal from '@features/reception/components/BlockRoomModal';
import RoomDetailModal from '@features/reception/components/RoomDetailModal';
import { RoomGrid } from '@features/reception/components/RoomGrid';
import { formatCurrency } from '@utils/formatters';

const HOUSEKEEPING_FILTERS = [
    { value: 'all', label: 'Todos' },
    { value: 'clean', label: 'Limpia' },
    { value: 'dirty', label: 'Sucia' },
    { value: 'maintenance', label: 'Mantenimiento' },
    { value: 'inspection', label: 'Inspección' },
];

export default function RackPage() {
    const [viewMode, setViewMode] = useState('grid');
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockRoom, setBlockRoom] = useState(null);

    const { rooms, isLoading, error, fetchRooms, updateRoom } = useReceptionRooms();
    const { dashboard, isLoading: dashLoading } = useReceptionDashboard();

    const filteredRooms = rooms.filter((room) => {
        if (filterStatus !== 'all' && room.housekeeping_status !== filterStatus) return false;
        if (search) {
            const q = search.toLowerCase();
            return (
                room.room_number?.toLowerCase().includes(q) ||
                room.room_type_name?.toLowerCase().includes(q) ||
                room.guest_name?.toLowerCase().includes(q) ||
                room.module_name?.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const occupied = rooms.filter((r) => r.reservation_status === 'checked_in').length;
    const available = rooms.filter((r) => !r.is_blocked && r.reservation_status !== 'checked_in' && r.reservation_status !== 'reserved').length;
    const blocked = rooms.filter((r) => r.is_blocked).length;

    async function handleBlockRoom(room, updates) {
        await updateRoom(room.id, updates);
        setShowBlockModal(false);
        setBlockRoom(null);
    }

    async function handleHousekeepingUpdate(roomId, updates) {
        await updateRoom(roomId, updates);
    }

    function openRoomDetail(room) {
        setSelectedRoom(room);
    }

    function openBlockModal(room) {
        setBlockRoom(room);
        setShowBlockModal(true);
    }

    const selectedReservation = selectedRoom?.reservation_status
        ? {
            id: selectedRoom.active_reservation_id,
            reservation_status: selectedRoom.reservation_status,
            guest_name: selectedRoom.guest_name,
            guest_document_type: selectedRoom.guest_document_type,
            guest_document_number: selectedRoom.guest_document_number,
            guest_phone: selectedRoom.guest_phone,
            guest_email: selectedRoom.guest_email,
            check_in: selectedRoom.reservation_check_in,
            check_out: selectedRoom.reservation_check_out,
            plan_name: selectedRoom.plan_name,
            control_number: selectedRoom.control_number,
            folio_balance: selectedRoom.folio_balance,
        }
        : null;

    return (
        <div className="py-5 w-full px-5">
            <div className="mx-auto max-w-auto space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Recepción</h1>
                        <p className="text-sm text-[var(--color-text-muted)]">Vista de habitaciones y ocupación</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <BcvRateDisplay className="min-w-[200px]" />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Habitaciones"
                        value={dashboard?.total_rooms ?? rooms.length}
                        icon={DoorOpen}
                        variant="default"
                    />
                    <StatCard
                        title="Ocupadas"
                        value={dashboard?.occupied ?? occupied}
                        subtitle={dashboard ? `de ${dashboard.total_rooms}` : `de ${rooms.length}`}
                        icon={BedDouble}
                        variant="primary"
                    />
                    <StatCard
                        title="Disponibles"
                        value={dashboard?.available ?? available}
                        icon={Users}
                        variant="success"
                    />
                    <StatCard
                        title="Bloqueadas"
                        value={dashboard?.blocked ?? blocked}
                        icon={ShieldAlert}
                        variant="danger"
                    />
                </div>

                <Card>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="relative flex-1 max-w-xs">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Buscar habitación..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="input pl-9"
                                />
                            </div>
                            <CustomDropdown
                                value={filterStatus}
                                onChange={setFilterStatus}
                                options={HOUSEKEEPING_FILTERS}
                                placeholder="Estado limpieza"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                icon={LayoutGrid}
                            >
                                Rack
                            </Button>
                            <Button
                                variant={viewMode === 'table' ? 'primary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('table')}
                                icon={List}
                            >
                                Tabla
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => fetchRooms()} icon={RefreshCw}>
                                
                            </Button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-[var(--color-danger)]">
                            <p>Error al cargar habitaciones</p>
                            <Button variant="ghost" size="sm" onClick={fetchRooms}>Reintentar</Button>
                        </div>
                    ) : (
                        <RoomGrid rooms={filteredRooms} onRoomClick={openRoomDetail} viewMode={viewMode} />
                    )}
                </Card>
            </div>

            <RoomDetailModal
                room={selectedRoom}
                reservation={selectedReservation}
                isOpen={!!selectedRoom}
                onClose={() => setSelectedRoom(null)}
                onBlockRoom={(room) => {
                    openBlockModal(room);
                    setSelectedRoom(null);
                }}
                onUpdateHousekeeping={handleHousekeepingUpdate}
            />

            <BlockRoomModal
                room={blockRoom}
                isOpen={showBlockModal}
                onClose={() => { setShowBlockModal(false); setBlockRoom(null); }}
                onConfirm={(updates) => handleBlockRoom(blockRoom, updates)}
            />
        </div>
    );
}