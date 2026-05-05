import { useState, useCallback } from 'react';
import { Sparkles, Wand2 } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import Button from '@shared/common/Button';
import { useHousekeeping } from '../hooks/useHousekeeping';
import HousekeepingStats from '../components/HousekeepingStats';
import AssignmentBoard from '../components/AssignmentBoard';
import AssignmentModal from '../components/AssignmentModal';
import AutoAssignModal from '../components/AutoAssignModal';

export default function Housekeeping() {
    const {
        rooms,
        staff,
        stats,
        loading,
        error,
        refetch,
        assignStaff,
        updateAssignmentStatus,
    } = useHousekeeping();

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);

    const handleStatusChange = useCallback(async (assignmentId, newStatus) => {
        await updateAssignmentStatus(assignmentId, newStatus);
    }, [updateAssignmentStatus]);

    const handleAssign = useCallback(async (staffId, roomIds) => {
        await assignStaff(staffId, roomIds);
        await refetch();
    }, [assignStaff, refetch]);

    const handleColumnAssign = useCallback(() => {
        setShowAssignModal(true);
    }, []);

    const dirtyCount = rooms.filter(r => r.housekeeping_status === 'dirty' && !r.assignment_id).length;

    return (
        <PageWrapper title="Housekeeping" subtitle="Gestión de limpieza de habitaciones" icon={Sparkles}>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <HousekeepingStats stats={loading ? null : stats} />
                    {dirtyCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={Wand2}
                            onClick={() => setShowAutoAssignModal(true)}
                        >
                            Auto-asignar
                        </Button>
                    )}
                </div>

                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <AssignmentBoard
                    rooms={rooms}
                    staff={staff}
                    loading={loading}
                    onStatusChange={handleStatusChange}
                    onColumnAssign={handleColumnAssign}
                />
            </div>

            <AssignmentModal
                rooms={rooms}
                staff={staff}
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                onAssign={handleAssign}
            />

            <AutoAssignModal
                isOpen={showAutoAssignModal}
                onClose={() => setShowAutoAssignModal(false)}
                onAssigned={refetch}
            />
        </PageWrapper>
    );
}
