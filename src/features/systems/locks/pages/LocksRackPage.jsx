import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { apiFetch } from '@utils/api';
import PageWrapper from '@shared/common/PageWrapper';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import { useToast } from '@context/ToastContext';
import { useLocksOverview } from '@features/systems/locks/hooks/useLocks';
import { useLockRackData } from '@features/systems/locks/hooks/useLockRackData';
import { LockSummaryCard } from '@features/systems/locks/components/LockSharedComponents';
import CreateLockEventModal from '@features/systems/locks/components/CreateLockEventModal';
import LockRackHeader from '@features/systems/locks/components/LockRackHeader';
import LockModuleTabs from '@features/systems/locks/components/LockModuleTabs';
import LockQuickModal from '@features/systems/locks/components/LockQuickModal';
import ReportModal from '@features/systems/locks/components/ReportModal';

export default function LocksRackPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreate, setShowCreate] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [activeModule, setActiveModule] = useState('todos');
    const [savingEvent, setSavingEvent] = useState(false);
    const [savingReport, setSavingReport] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Quick modal state
    const [quickModalLock, setQuickModalLock] = useState(null);
    const [quickModalEvents, setQuickModalEvents] = useState([]);
    const [showQuickModal, setShowQuickModal] = useState(false);
    const [quickModalLoading, setQuickModalLoading] = useState(false);

    const { locks, predictionsByRoom, loading, error, fetchLocksOverview } = useLocksOverview();

    const {
        groupedByModule,
        operationalSummary,
        priorityLocks,
        filteredLocks
    } = useLockRackData(locks, predictionsByRoom, search, statusFilter);

    const modules = useMemo(() => {
        const list = groupedByModule.map(m => ({
            id: String(m.moduleId),
            name: m.moduleName || `Módulo ${m.moduleNumber || m.moduleId}`,
            count: m.rooms.length,
        }));
        return [{ id: 'todos', name: 'Todos', count: filteredLocks.length }, ...list];
    }, [groupedByModule, filteredLocks.length]);

    const displayedRooms = useMemo(() => {
        if (activeModule === 'todos') {
            return groupedByModule.flatMap(m => m.rooms);
        }
        const mod = groupedByModule.find(m => String(m.moduleId) === activeModule);
        return mod ? mod.rooms : [];
    }, [groupedByModule, activeModule]);

    useEffect(() => {
        fetchLocksOverview();
    }, [fetchLocksOverview]);

    const handleOpenQuickModal = useCallback(async (item) => {
        setQuickModalLoading(true);
        setShowQuickModal(true);
        try {
            const lockId = item.id;
            if (lockId) {
                const payload = await apiFetch(`/api/maintenance/locks/${lockId}/events`);
                setQuickModalLock(payload.lock || item);
                setQuickModalEvents(payload.events || []);
            } else {
                setQuickModalLock(item);
                setQuickModalEvents([]);
            }
        } catch {
            setQuickModalLock(item);
            setQuickModalEvents([]);
        } finally {
            setQuickModalLoading(false);
        }
    }, []);

    const openLockDetail = (roomId) => {
        if (!roomId) {
            return;
        }
        navigate(`/systems/room/${roomId}`);
    };

    const handleCreateEvent = async (data) => {
        setSavingEvent(true);
        try {
            await apiFetch('/api/maintenance', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            setShowCreate(false);
            await fetchLocksOverview(true);
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

    const handleUpdateLockStatus = useCallback(async (lockId, status) => {
        if (!lockId || !status) {
            return;
        }
        setUpdatingStatus(true);
        try {
            await apiFetch(`/api/maintenance/locks/${lockId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            await fetchLocksOverview(true);
            if (quickModalLock?.id === lockId) {
                const payload = await apiFetch(`/api/maintenance/locks/${lockId}/events`);
                setQuickModalLock(payload.lock || quickModalLock);
            }
        } catch {
            showToast({
                title: 'Error',
                message: 'No se pudo actualizar el estado',
                type: 'error',
            });
        } finally {
            setUpdatingStatus(false);
        }
    }, [fetchLocksOverview, quickModalLock]);

    const refreshQuickModal = useCallback(async () => {
        if (!quickModalLock?.id) return;
        try {
            const payload = await apiFetch(`/api/maintenance/locks/${quickModalLock.id}/events`);
            setQuickModalLock(payload.lock || quickModalLock);
            setQuickModalEvents(payload.events || []);
        } catch {
            // silently fail
        }
    }, [quickModalLock]);

    const handleToggleReviewStatus = useCallback(async (lockId, currentStatus) => {
        const newStatus = currentStatus === 'needs_review' ? 'operational' : 'needs_review';
        try {
            await apiFetch(`/api/maintenance/locks/${lockId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });
            await fetchLocksOverview(true);
        } catch {
            showToast({
                title: 'Error',
                message: 'No se pudo actualizar el estado',
                type: 'error',
            });
        }
    }, [fetchLocksOverview]);

    const handleCreateReport = async (data) => {
        setSavingReport(true);
        try {
            await apiFetch('/api/maintenance/reports', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            setShowReport(false);
            await fetchLocksOverview(true);
            showToast({
                title: 'Reporte creado',
                message: 'El reporte ha sido registrado exitosamente',
                type: 'success',
            });
        } catch (err) {
            showToast({
                title: 'Error',
                message: err.message || 'No se pudo crear el reporte',
                type: 'error',
            });
        } finally {
            setSavingReport(false);
        }
    };

    if (loading) {
        return (
            <PageWrapper title="Control de Cerraduras" icon={Lock}>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title="Control de Cerraduras" icon={Lock}>
            <div className="space-y-4">
                <LockRackHeader
                    priorityLocks={priorityLocks}
                    operationalSummary={operationalSummary}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    onOpenCreateEvent={() => {
                        setShowCreate(true);
                    }}
                    onOpenReport={() => setShowReport(true)}
                    onOpenLockDetail={openLockDetail}
                />

                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <LockModuleTabs
                    modules={modules}
                    activeModule={activeModule}
                    onModuleChange={setActiveModule}
                    search={search}
                    setSearch={setSearch}
                    onRefresh={() => fetchLocksOverview(true)}
                />

                {/* ── Rack ── */}
                <div className="space-y-2">
                    {displayedRooms.length === 0 ? (
                        <div className="flex items-center justify-center h-96 text-[var(--color-text-muted)]">
                            <div className="text-center">
                                <p className="text-lg font-medium">No hay cerraduras para mostrar con los filtros actuales.</p>
                                <p className="text-sm mt-1">Ajusta los filtros para ver resultados.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-2 auto-rows-fr [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
                            {displayedRooms.map((item) => (
                                <LockSummaryCard
                                    key={item.id}
                                    item={item}
                                    prediction={item.prediction}
                                    onOpen={handleOpenQuickModal}
                                    onOpenDetail={openLockDetail}
                                    onToggleStatus={handleToggleReviewStatus}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showCreate && (
                <CreateLockEventModal
                    onSave={handleCreateEvent}
                    onCancel={() => setShowCreate(false)}
                    saving={savingEvent}
                />
            )}

            {showQuickModal && quickModalLock && (
                <LockQuickModal
                    lock={quickModalLock}
                    prediction={predictionsByRoom[quickModalLock.room_id]}
                    events={quickModalEvents}
                    onClose={() => {
                        setShowQuickModal(false);
                        setQuickModalLock(null);
                        setQuickModalEvents([]);
                    }}
                    onUpdateStatus={handleUpdateLockStatus}
                    onOpenDetail={openLockDetail}
                    onRefresh={refreshQuickModal}
                    updatingStatus={quickModalLoading || updatingStatus}
                />
            )}

            {showReport && (
                <ReportModal
                    onSave={handleCreateReport}
                    onCancel={() => setShowReport(false)}
                    saving={savingReport}
                />
            )}
        </PageWrapper>
    );
}
