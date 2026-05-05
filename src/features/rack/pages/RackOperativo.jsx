import { useState, useCallback, useMemo, useEffect } from 'react';
import { Monitor } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import { useRackOperativo } from '../hooks/useRackOperativo';
import { useRackData } from '../hooks/useRackData';
import { useBcvRate } from '@hooks/useSettings';
import RackHeader from '../components/RackHeader';
import RackGrid from '../components/RackGrid';
import RackRoomDetail from '../components/RackRoomDetail';

export default function RackOperativo() {
    const { rooms, arrivals, departures, loading, connected, error, refetch } = useRackOperativo();
    const { rate: bcvRate } = useBcvRate();
    const [viewMode, setViewMode] = useState('normal');
    const [filters, setFilters] = useState({
        floorFilter: '',
        typeFilter: '',
        stateFilter: '',
        searchQuery: '',
        quickFilter: '',
    });
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [isMobile, setIsMobile] = useState(false);

    // Track mobile viewport
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Apply quick filters before passing to useRackData
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

    const { groupedRooms, stats, uniqueFloors, uniqueTypes } = useRackData(filteredRoomsForData, filters);

    const handleFilterChange = useCallback((updates) => {
        setFilters(prev => ({ ...prev, ...updates }));
    }, []);

    const handleRoomClick = useCallback((room) => {
        setSelectedRoom(room);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setSelectedRoom(null);
    }, []);

    const handleRoomUpdated = useCallback(() => {
        refetch();
    }, [refetch]);

    if (loading && !rooms.length) {
        return (
            <PageWrapper title="Rack Operativo" subtitle="Vista en tiempo real del estado de habitaciones" icon={Monitor}>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title="Rack Operativo" subtitle="Vista en tiempo real del estado de habitaciones" icon={Monitor}>
            <div className={`transition-all duration-300 ${selectedRoom && !isMobile ? 'mr-80' : ''}`}>
                <div className="space-y-4">
                    <RackHeader
                        stats={stats}
                        arrivalsCount={arrivals.length}
                        departuresCount={departures.length}
                        connected={connected}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        uniqueFloors={uniqueFloors}
                        uniqueTypes={uniqueTypes}
                        onRefresh={refetch}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        bcvRate={bcvRate}
                    />

                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <RackGrid
                        groupedRooms={groupedRooms}
                        viewMode={viewMode}
                        onRoomClick={handleRoomClick}
                    />
                </div>
            </div>

            <RackRoomDetail
                room={selectedRoom}
                isOpen={!!selectedRoom}
                onClose={handleCloseDetail}
                onUpdated={handleRoomUpdated}
                isMobile={isMobile}
            />
        </PageWrapper>
    );
}
