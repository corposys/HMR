import { useState, useCallback, useEffect } from 'react';
import { ClipboardCheck, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import { apiFetch } from '@utils/api';
import InspectionQueueItem, { InspectionQueueItemSkeleton } from '../components/InspectionQueue';
import InspectionModal from '../components/InspectionModal';

export default function InspectionPage() {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filterStaff, setFilterStaff] = useState('all');

    const fetchPending = useCallback(async () => {
        try {
            const data = await apiFetch('/api/housekeeping/assignments/pending-inspection');
            setAssignments(data.assignments || []);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    const handleApprove = async (assignmentId, notes) => {
        await apiFetch(`/api/housekeeping/assignments/${assignmentId}/inspect`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved: true, notes }),
        });
        await fetchPending();
    };

    const handleReject = async (assignmentId, notes) => {
        await apiFetch(`/api/housekeeping/assignments/${assignmentId}/inspect`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved: false, notes }),
        });
        await fetchPending();
    };

    const handleQuickApprove = async (assignmentId) => {
        await apiFetch(`/api/housekeeping/assignments/${assignmentId}/inspect`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved: true, notes: null }),
        });
        await fetchPending();
    };

    const handleQuickReject = async (assignmentId) => {
        await apiFetch(`/api/housekeeping/assignments/${assignmentId}/inspect`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ approved: false, notes: null }),
        });
        await fetchPending();
    };

    const handleOpenDetail = (assignment) => {
        setSelectedAssignment(assignment);
        setShowModal(true);
    };

    const uniqueStaff = [...new Map(assignments.map(a => [a.staff_id, { id: a.staff_id, name: a.staff_name, color: a.staff_color }])).values()];
    const filteredAssignments = filterStaff === 'all'
        ? assignments
        : assignments.filter(a => String(a.staff_id) === filterStaff);

    return (
        <PageWrapper title="Inspección" subtitle="Revisión y aprobación de limpiezas" icon={ClipboardCheck}>
            <div className="space-y-4">
                {/* Stats Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                        onClick={() => setFilterStaff('all')}
                        className={`
                            flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium shrink-0 transition-all duration-150
                            ${filterStaff === 'all'
                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                            }
                        `}
                    >
                        <Clock className="w-3 h-3" />
                        Todas
                        <span className="text-[10px] opacity-70">{assignments.length}</span>
                    </button>
                    {uniqueStaff.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setFilterStaff(String(s.id))}
                            className={`
                                flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium shrink-0 transition-all duration-150
                                ${filterStaff === String(s.id)
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                    : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                                }
                            `}
                        >
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.name.split(' ')[0]}
                            <span className="text-[10px] opacity-70">
                                {assignments.filter(a => a.staff_id === s.id).length}
                            </span>
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {!loading && assignments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
                        <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">No hay habitaciones pendientes de inspección</p>
                        <p className="text-xs mt-1 opacity-60">Todas las limpiezas han sido revisadas</p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => <InspectionQueueItemSkeleton key={i} />)
                        : filteredAssignments.map(assignment => (
                            <div key={assignment.id} className="relative">
                                <InspectionQueueItem
                                    assignment={assignment}
                                    onApprove={handleQuickApprove}
                                    onReject={handleQuickReject}
                                />
                                <button
                                    onClick={() => handleOpenDetail(assignment)}
                                    className="absolute top-2 right-2 p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors"
                                    title="Ver detalle"
                                >
                                    <Filter className="w-3 h-3 text-[var(--color-text-muted)]" />
                                </button>
                            </div>
                        ))
                    }
                </div>
            </div>

            <InspectionModal
                assignment={selectedAssignment}
                isOpen={showModal}
                onClose={() => { setShowModal(false); setSelectedAssignment(null); }}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </PageWrapper>
    );
}
