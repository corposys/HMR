import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen } from 'lucide-react';
import { apiFetch } from '@utils/api';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import { useToast } from '@context/ToastContext';
import { useLocksOverview } from '@features/maintenance/locks/hooks/useLocks';
import { useLockRackData } from '@features/maintenance/locks/hooks/useLockRackData';
import { RACK_VIEW_MODES } from '@features/maintenance/locks/utils/lockConstants';
import { formatFloorCode } from '@features/maintenance/locks/utils/lockHelpers';
import { LockSummaryCard } from '@features/maintenance/locks/components/LockSharedComponents';
import CreateLockEventModal from '@features/maintenance/locks/components/CreateLockEventModal';
import LockRackHeader from '@features/maintenance/locks/components/LockRackHeader';
import LockTimelineModal from '@features/maintenance/locks/components/LockTimelineModal';

export default function LocksRackPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedLockId, setSelectedLockId] = useState(null);
    const [selectedLock, setSelectedLock] = useState(null);
    const [events, setEvents] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [rackViewMode] = useState(RACK_VIEW_MODES.priority);
    const [savingEvent, setSavingEvent] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const { locks, predictionsByRoom, loading, error, fetchLocksOverview } = useLocksOverview();

    const {
        groupedLocks,
        groupedPriorityByModule,
        groupedByModule,
        groupedByStructure,
        operationalSummary,
        priorityLocks,
        filteredLocks
    } = useLockRackData(locks, predictionsByRoom, search, statusFilter);

    useEffect(() => {
        fetchLocksOverview();
    }, [fetchLocksOverview]);

    const fetchLockDetail = async (lockId) => {
        if (!lockId) {
            return;
        }
        setDetailLoading(true);
        try {
            const payload = await apiFetch(`/api/maintenance/locks/${lockId}/events`);
            setSelectedLock(payload.lock || null);
            setEvents(payload.events || []);
        } catch {
            setSelectedLock(null);
            setEvents([]);
        } finally {
            setDetailLoading(false);
        }
    };

    useEffect(() => {
        fetchLockDetail(selectedLockId);
    }, [selectedLockId]);

    const selectedPrediction = selectedLock ? predictionsByRoom[selectedLock.room_id] : null;

    const handleCreateEvent = async (data) => {
        setSavingEvent(true);
        try {
            await apiFetch('/api/maintenance', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            setShowCreate(false);
            await fetchLocksOverview();
            if (selectedLockId) {
                await fetchLockDetail(selectedLockId);
            }
        } catch {
            showToast({
                title: 'Error',
                message: 'No se pudo guardar el evento',
                type: 'error',
            });
        } finally {
            setSavingEvent(false);
        }
    };

    const handleUpdateLockStatus = async (status) => {
        if (!selectedLockId || !selectedLock || selectedLock.status === status) {
            return;
        }

        setUpdatingStatus(true);
        try {
            await apiFetch(`/api/maintenance/locks/${selectedLockId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            await fetchLocksOverview();
            await fetchLockDetail(selectedLockId);
        } catch {
            showToast({
                title: 'Error',
                message: 'No se pudo actualizar el estado',
                type: 'error',
            });
        } finally {
            setUpdatingStatus(false);
        }
    };

    const openLockDetail = (roomId) => {
        if (!roomId) {
            return;
        }
        navigate(`/maintenance/room/${roomId}`);
    };

    const openLockModal = (roomId) => {
        setSelectedLockId(roomId);
        setShowTimelineModal(true);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="py-5 w-full px-5">
            <div className="mx-auto max-w-auto space-y-4">
                <LockRackHeader
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    search={search}
                    setSearch={setSearch}
                    operationalSummary={operationalSummary}
                    priorityLocks={priorityLocks}
                    onOpenCreateEvent={() => {
                        setSelectedLockId(null);
                        setSelectedLock(null);
                        setShowCreate(true);
                    }}
                    onOpenLockDetail={openLockDetail}
                    failureCount={filteredLocks.filter((item) => item.status === 'failure').length}
                    outOfServiceCount={filteredLocks.filter((item) => item.status === 'out_of_service').length}
                />

                {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                        {error}
                    </div>
                )}

                {/* ── Rack ── */}
                <div className="space-y-2">
                    {groupedLocks.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-10 text-center">
                            <p className="text-sm text-[var(--color-text-muted)]">No hay cerraduras para mostrar con los filtros actuales.</p>
                        </div>
                    ) : (
                        rackViewMode === RACK_VIEW_MODES.structure ? (
                            <div className="space-y-3">
                                {groupedByStructure.map((module) => (
                                    <section key={module.moduleId} className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90">
                                        <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/45 px-3 py-2">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                                                <DoorOpen className="h-3 w-3 text-[var(--color-primary)]" />
                                                <span>{module.moduleName || `Módulo ${module.moduleNumber || module.moduleId}`}</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">{module.floors.length} pisos</span>
                                        </div>

                                        <div className="space-y-2 p-2">
                                            {module.floors.map((floor) => (
                                                <article key={`${module.moduleId}-${floor.floorCode}`} className="overflow-hidden rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-primary)]/35">
                                                    <div className="flex items-center justify-between border-b border-[var(--color-border)]/60 px-2.5 py-1.5">
                                                        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-primary)]">
                                                            <span className="font-semibold">{formatFloorCode(floor.floorCode)}</span>
                                                            <span className="text-[var(--color-text-muted)] text-[10px]">·</span>
                                                            <span className="text-[var(--color-text-secondary)] text-[10px]">{module.moduleName}</span>
                                                        </div>
                                                        <span className="text-[10px] text-[var(--color-text-muted)]">{floor.rooms.length} hab.</span>
                                                    </div>
                                                    <div className="grid gap-1.5 p-1.5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                                                        {floor.rooms.map((item) => (
                                                            <LockSummaryCard key={item.id} item={item} prediction={item.prediction} onOpen={openLockDetail} />
                                                        ))}
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        ) : rackViewMode === RACK_VIEW_MODES.module ? (
                            <div className="space-y-3">
                                {groupedByModule.map((module) => (
                                    <section key={module.moduleId} className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90">
                                        <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/45 px-3 py-2">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                                                <DoorOpen className="h-3 w-3 text-[var(--color-primary)]" />
                                                <span>{module.moduleName || `Módulo ${module.moduleNumber || module.moduleId}`}</span>
                                            </div>
                                            <span className="text-[10px] text-[var(--color-text-muted)]">{module.rooms.length} hab.</span>
                                        </div>
                                        <div className="grid gap-2 p-2 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                                            {module.rooms.map((item) => (
                                                <LockSummaryCard key={item.id} item={item} prediction={item.prediction} onOpen={openLockDetail} />
                                            ))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90">
                                <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/45 px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                                            <DoorOpen className="h-3 w-3 text-[var(--color-primary)]" />
                                            <span>Rack de prioridad</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-[var(--color-text-muted)]">{groupedPriorityByModule.reduce((total, module) => total + module.rooms.length, 0)} hab.</span>
                                </div>

                                <div className="space-y-3 p-2">
                                    {groupedPriorityByModule.map((module) => (
                                        <section key={module.moduleId || module.moduleName} className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90">
                                            <div className="flex items-center justify-between border-b border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/45 px-3 py-2">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                                                    <DoorOpen className="h-3 w-3 text-[var(--color-primary)]" />
                                                    <span>{module.moduleName || `Módulo ${module.moduleNumber || module.moduleId}`}</span>
                                                </div>
                                                <span className="text-[10px] text-[var(--color-text-muted)]">{module.rooms.length} hab.</span>
                                            </div>

                                            <div className="grid gap-2 p-2 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
                                                {module.rooms.map((item) => (
                                                    <LockSummaryCard key={item.id} item={item} prediction={item.prediction} onOpen={openLockDetail} />
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>

            {showCreate && (
                <CreateLockEventModal
                    onSave={handleCreateEvent}
                    onCancel={() => setShowCreate(false)}
                    saving={savingEvent}
                    initialRoomId={selectedLock?.room_id ?? null}
                    lockRoomSelection={Boolean(selectedLock)}
                />
            )}

            {showTimelineModal && selectedLock && (
                <LockTimelineModal
                    selectedLock={selectedLock}
                    events={events}
                    selectedPrediction={selectedPrediction}
                    detailLoading={detailLoading}
                    onClose={() => setShowTimelineModal(false)}
                    onCreateEvent={() => {
                        setShowTimelineModal(false);
                        setShowCreate(true);
                    }}
                    onRefresh={() => fetchLockDetail(selectedLockId)}
                    onUpdateStatus={handleUpdateLockStatus}
                    updatingStatus={updatingStatus}
                />
            )}
        </div>
    );
}
