import { useState, useMemo, useCallback } from 'react';
import { Sparkles, Filter, BedDouble, CheckCircle, Clock, AlertTriangle, ClipboardCheck } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import { useHousekeeping } from '../hooks/useHousekeeping';
import MaidRoomCard, { MaidRoomCardSkeleton } from '../components/MaidRoomCard';
import IncidentFormModal from '../components/IncidentFormModal';

export default function MaidPanel() {
    const {
        rooms,
        staff,
        loading,
        error,
        refetch,
        updateAssignmentStatus,
        createIncident,
    } = useHousekeeping();

    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [filterGroup, setFilterGroup] = useState('all');
    const [incidentRoom, setIncidentRoom] = useState(null);
    const [showIncidentModal, setShowIncidentModal] = useState(false);

    const activeStaff = useMemo(() => staff.filter(s => s.is_active), [staff]);

    const selectedStaff = useMemo(() => activeStaff.find(s => String(s.id) === selectedStaffId), [activeStaff, selectedStaffId]);

    const assignedRooms = useMemo(() => {
        if (!selectedStaffId) return [];
        return rooms.filter(r => String(r.staff_id) === selectedStaffId && r.assignment_id);
    }, [rooms, selectedStaffId]);

    const filteredRooms = useMemo(() => {
        if (filterGroup === 'all') return assignedRooms;
        return assignedRooms.filter(r => {
            if (filterGroup === 'assigned') return r.assignment_status === 'assigned';
            if (filterGroup === 'in_progress') return r.assignment_status === 'in_progress';
            if (filterGroup === 'completed') return r.assignment_status === 'completed' || r.housekeeping_status === 'inspection';
            if (filterGroup === 'maintenance') return r.housekeeping_status === 'maintenance';
            return true;
        });
    }, [assignedRooms, filterGroup]);

    const stats = useMemo(() => {
        return {
            total: assignedRooms.length,
            assigned: assignedRooms.filter(r => r.assignment_status === 'assigned').length,
            in_progress: assignedRooms.filter(r => r.assignment_status === 'in_progress').length,
            completed: assignedRooms.filter(r => r.assignment_status === 'completed' || r.housekeeping_status === 'inspection').length,
            maintenance: assignedRooms.filter(r => r.housekeeping_status === 'maintenance').length,
        };
    }, [assignedRooms]);

    const handleStatusChange = useCallback(async (assignmentId, newStatus) => {
        await updateAssignmentStatus(assignmentId, newStatus);
        await refetch();
    }, [updateAssignmentStatus, refetch]);

    const handleReportIncident = useCallback((room) => {
        setIncidentRoom(room);
        setShowIncidentModal(true);
    }, []);

    const handleIncidentSubmit = useCallback(async (data) => {
        await createIncident(data);
        setShowIncidentModal(false);
        setIncidentRoom(null);
    }, [createIncident]);

    const filters = [
        { key: 'all', label: 'Todas', count: stats.total },
        { key: 'assigned', label: 'Asignadas', count: stats.assigned },
        { key: 'in_progress', label: 'Limpiando', count: stats.in_progress },
        { key: 'completed', label: 'Pendiente insp.', count: stats.completed },
        { key: 'maintenance', label: 'Mantenimiento', count: stats.maintenance },
    ];

    return (
        <PageWrapper title="Panel de Camarera" subtitle="Vista operativa de limpieza" icon={Sparkles}>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                        <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                            Seleccionar camarera
                        </label>
                        <select
                            value={selectedStaffId}
                            onChange={e => setSelectedStaffId(e.target.value)}
                            className="input w-full text-sm rounded-lg"
                        >
                            <option value="">-- Elegir --</option>
                            {activeStaff.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.full_name} ({s.role === 'supervisor' ? 'Sup.' : 'Cam.'})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedStaffId && selectedStaff && (
                        <div className="flex items-end">
                            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: selectedStaff.color }}
                                />
                                <span className="text-sm font-medium">
                                    {selectedStaff.full_name}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {selectedStaffId && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {filters.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilterGroup(f.key)}
                                className={`
                                    flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium shrink-0 transition-all duration-150
                                    ${filterGroup === f.key
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                        : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                                    }
                                `}
                            >
                                {f.key === 'assigned' && <Clock className="w-3 h-3" />}
                                {f.key === 'in_progress' && <BedDouble className="w-3 h-3" />}
                                {f.key === 'completed' && <ClipboardCheck className="w-3 h-3" />}
                                {f.key === 'maintenance' && <AlertTriangle className="w-3 h-3" />}
                                {f.label}
                                <span className="text-[10px] opacity-70">{f.count}</span>
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {!selectedStaffId && !loading && (
                    <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
                        <Filter className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">Selecciona una camarera para ver sus asignaciones</p>
                    </div>
                )}

                {selectedStaffId && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <MaidRoomCardSkeleton key={i} />
                            ))
                        ) : filteredRooms.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
                                <BedDouble className="w-10 h-10 mb-2 opacity-20" />
                                <p className="text-sm">No hay habitaciones en este grupo</p>
                            </div>
                        ) : (
                            filteredRooms.map(room => (
                                <MaidRoomCard
                                    key={room.id}
                                    room={room}
                                    onStatusChange={handleStatusChange}
                                    onReportIncident={handleReportIncident}
                                />
                            ))
                        )}
                    </div>
                )}
            </div>

            <IncidentFormModal
                room={incidentRoom}
                assignmentId={incidentRoom?.assignment_id}
                staffId={selectedStaffId ? Number(selectedStaffId) : null}
                isOpen={showIncidentModal}
                onClose={() => { setShowIncidentModal(false); setIncidentRoom(null); }}
                onSubmit={handleIncidentSubmit}
            />
        </PageWrapper>
    );
}
