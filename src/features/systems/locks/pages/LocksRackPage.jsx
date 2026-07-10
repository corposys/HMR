import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LayoutGrid, Package } from 'lucide-react';
import { apiFetch } from '@utils/api';
import PageWrapper from '@shared/common/PageWrapper';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import { useToast } from '@context/ToastContext';
import { useLocksOverview } from '@features/systems/locks/hooks/useLocks';
import { useLockRackData } from '@features/systems/locks/hooks/useLockRackData';
import { LockSummaryCard } from '@features/systems/locks/components/LockSharedComponents';
import LocksTable from '@features/systems/locks/components/LocksTable';
import CreateLockEventModal from '@features/systems/locks/components/CreateLockEventModal';
import LockRackHeader from '@features/systems/locks/components/LockRackHeader';
import LockModuleTabs from '@features/systems/locks/components/LockModuleTabs';
import LockStatusPopover from '@features/systems/locks/components/LockStatusPopover';
import ReportModal from '@features/systems/locks/components/ReportModal';
import PartsInventory from '@features/systems/locks/pages/PartsInventory';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function LocksRackPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('cards');
    const [mainTab, setMainTab] = useState('rack');
    const [showCreate, setShowCreate] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [activeModule, setActiveModule] = useState('todos');
    const [savingEvent, setSavingEvent] = useState(false);
    const [savingReport, setSavingReport] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Status popover state
    const [statusPopoverLock, setStatusPopoverLock] = useState(null);
    const [showStatusPopover, setShowStatusPopover] = useState(false);

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

    const handleOpenStatusPopover = useCallback((item) => {
        setStatusPopoverLock(item);
        setShowStatusPopover(true);
    }, []);

    const openLockDetail = (roomId) => {
        if (!roomId) {
            return;
        }
        const lockData = displayedRooms.find(r => r.room_id === roomId || r.id === roomId);
        navigate(`/systems/room/${roomId}`, {
            state: lockData ? { lock: lockData, prediction: lockData.prediction } : undefined,
        });
    };

    const handleCreateEvent = async (data) => {
        setSavingEvent(true);
        try {
            await apiFetch('/api/maintenance/batch', {
                method: 'POST',
                body: JSON.stringify(data),
            });
            setShowCreate(false);
            await fetchLocksOverview(true);
            showToast({
                title: 'Eventos registrados',
                message: `${data.events.length} evento(s) registrado(s) correctamente`,
                type: 'success',
            });
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
            if (statusPopoverLock?.id === lockId) {
                setStatusPopoverLock(prev => prev ? { ...prev, status } : prev);
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
    }, [fetchLocksOverview, statusPopoverLock]);

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

    if (loading && mainTab === 'rack') {
        return (
            <PageWrapper title="Control de Cerraduras" icon={Lock}>
                <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
                    <TabsList className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] mb-4">
                        <TabsTrigger value="rack" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                            <LayoutGrid className="w-4 h-4" />
                            Rack
                        </TabsTrigger>
                        <TabsTrigger value="parts" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Inventario
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper title="Control de Cerraduras" icon={Lock}>
            <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
                <TabsList className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] mb-4">
                    <TabsTrigger value="rack" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" />
                        Rack
                    </TabsTrigger>
                    <TabsTrigger value="parts" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Inventario
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="rack" className="mt-0">
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
                            viewMode={viewMode}
                            setViewMode={setViewMode}
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
                            ) : viewMode === 'table' ? (
                                <LocksTable
                                    locks={displayedRooms}
                                    onOpen={handleOpenStatusPopover}
                                    onOpenDetail={openLockDetail}
                                />
                            ) : (
                                <div className="group/grid grid gap-2 auto-rows-fr [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]">
                                    {displayedRooms.map((item) => (
                                        <LockSummaryCard
                                            key={item.id}
                                            item={item}
                                            prediction={item.prediction}
                                            onOpen={handleOpenStatusPopover}
                                            onOpenDetail={openLockDetail}
                                            onToggleStatus={handleToggleReviewStatus}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="parts" className="mt-0">
                    <PartsInventory />
                </TabsContent>
            </Tabs>

            {showCreate && (
                <CreateLockEventModal
                    onSave={handleCreateEvent}
                    onCancel={() => setShowCreate(false)}
                    saving={savingEvent}
                />
            )}

            {showStatusPopover && statusPopoverLock && (
                <LockStatusPopover
                    lock={statusPopoverLock}
                    onUpdateStatus={handleUpdateLockStatus}
                    onOpenDetail={openLockDetail}
                    onClose={() => {
                        setShowStatusPopover(false);
                        setStatusPopoverLock(null);
                    }}
                    updating={updatingStatus}
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
