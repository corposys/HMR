import { useState, useCallback, useMemo } from 'react';
import { Monitor } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import { useRackOperativo } from '../hooks/useRackOperativo';
import { useRackData } from '../hooks/useRackData';
import { useBcvRate } from '@hooks/useSettings';
import RackHeader from '../components/RackHeader';
import RackModuleTabs from '../components/RackModuleTabs';
import RackRoomCard from '../components/RackRoomCard';
import RackRoomDialog from '../components/RackRoomDialog';

export default function RackOperativo() {
    const { rooms, arrivals, departures, loading, error, refetch } = useRackOperativo();
    const { rate: bcvRate } = useBcvRate();
    const [filters, setFilters] = useState({
        floorFilter: '',
        typeFilter: '',
        stateFilter: '',
        searchQuery: '',
        quickFilter: '',
    });
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [activeModule, setActiveModule] = useState('todos');

    const handleFilterChange = useCallback((updates) => {
        setFilters(prev => ({ ...prev, ...updates }));
    }, []);

    const filteredRoomsForData = useMemo(() => {
        if (filters.quickFilter === 'arrivals') {
            const arrivalRoomNumbers = new Set(arrivals.map(a => a.room_number));
            return rooms.filter(r => arrivalRoomNumbers.has(r.room_number));
        }
        if (filters.quickFilter === 'departures') {
            const departureRoomNumbers = new Set(departures.map(d => d.room_number));
            return rooms.filter(r => departureRoomNumbers.has(r.room_number));
        }
        return rooms;
    }, [rooms, arrivals, departures, filters.quickFilter]);

    const { groupedRooms, stats } = useRackData(filteredRoomsForData, filters);

    const modules = useMemo(() => {
        const list = groupedRooms.map(m => ({
            id: String(m.module_id),
            name: m.module_name,
            count: m.floors.reduce((s, f) => s + f.rooms.length, 0),
        }));
        return [{ id: 'todos', name: 'Todos', count: stats.total }, ...list];
    }, [groupedRooms, stats.total]);

    const displayedRooms = useMemo(() => {
        if (activeModule === 'todos') {
            return groupedRooms.flatMap(m => m.floors.flatMap(f => f.rooms));
        }
        const mod = groupedRooms.find(m => String(m.module_id) === activeModule);
        return mod ? mod.floors.flatMap(f => f.rooms) : [];
    }, [groupedRooms, activeModule]);

    const handleRoomClick = useCallback((room) => {
        setSelectedRoom(room);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setSelectedRoom(null);
    }, []);



    if (loading && !rooms.length) {
        return (
            <PageWrapper title="Rack Operativo" icon={Monitor}>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title="Rack Operativo" icon={Monitor}>
            <div className="space-y-4">
                <RackHeader
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onRefresh={refetch}
                    bcvRate={bcvRate}
                    arrivalsCount={arrivals.length}
                    departuresCount={departures.length}
                    dirtyCount={stats.dirty}
                />

                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <RackModuleTabs
                    modules={modules}
                    activeModule={activeModule}
                    onModuleChange={setActiveModule}
                    stats={stats}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />

                {displayedRooms.length === 0 ? (
                    <div className="flex items-center justify-center h-96 text-[var(--color-text-muted)]">
                        <div className="text-center">
                            <p className="text-lg font-medium">No hay habitaciones que coincidan</p>
                            <p className="text-sm mt-1">Ajusta los filtros para ver resultados</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {displayedRooms.map(room => (
                            <RackRoomCard key={room.id} room={room} onClick={handleRoomClick} />
                        ))}
                    </div>
                )}
            </div>

            <RackRoomDialog
                room={selectedRoom}
                isOpen={!!selectedRoom}
                onClose={handleCloseDetail}
            />
        </PageWrapper>
    );
}
