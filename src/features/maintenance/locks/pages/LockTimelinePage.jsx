import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Battery,
    Calendar,
    DoorOpen,
    ShieldAlert,
    User,
    Plus,
    RefreshCw,
    AlertCircle,
    Wrench,
    BatteryFull,
    Activity,
    Clock3,
    MapPin,
    Hash,
} from 'lucide-react';
import { apiFetch } from '@utils/api';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import CreateLockEventModal from '@features/maintenance/locks/components/CreateLockEventModal';
import { LOCK_STATUS_STYLES, LOCK_STATUS_LABELS } from '@features/maintenance/locks/utils/lockConstants';
import { formatDate } from '@features/maintenance/locks/utils/lockHelpers';
import { HealthBar, DetailMetric, SectionTitle } from '@features/maintenance/locks/components/LockSharedComponents';

export default function LockTimelinePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [lock, setLock] = useState(null);
    const [events, setEvents] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [savingEvent, setSavingEvent] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const roomId = Number(id);

    const fetchDetail = useCallback(async () => {
        if (!Number.isFinite(roomId)) {
            setError('Habitación inválida');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const [locksData, predData] = await Promise.all([
                apiFetch('/api/maintenance/locks'),
                apiFetch('/api/maintenance/predictions'),
            ]);

            const foundLock = (locksData.locks || []).find((item) => Number(item.room_id) === roomId) || null;
            setLock(foundLock);

            const foundPrediction = (predData.predictions || []).find((item) => Number(item.room_id) === roomId) || null;
            setPrediction(foundPrediction);

            if (foundLock?.id) {
                const eventsData = await apiFetch(`/api/maintenance/locks/${foundLock.id}/events`);
                setEvents(eventsData.events || []);
            } else {
                const fallbackData = await apiFetch(`/api/maintenance?room_id=${roomId}`);
                setEvents(fallbackData.logs || []);
            }
        } catch (err) {
            setError(err.message || 'Error cargando detalle');
            setEvents([]);
            setPrediction(null);
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const orderedEvents = useMemo(() => {
        return [...events].sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at));
    }, [events]);

    const lastEvent = orderedEvents[0] || null;

    const handleCreateEvent = async (data) => {
        setSavingEvent(true);
        try {
            const payload = {
                ...data,
                room_id: Number(data.room_id || roomId),
                part_type_id: data.part_type_id ? Number(data.part_type_id) : null,
            };

            await apiFetch('/api/maintenance', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            setShowCreate(false);
            await fetchDetail();
        } catch {
            // Keep current view state if save fails.
        } finally {
            setSavingEvent(false);
        }
    };

    const handleUpdateLockStatus = async (status) => {
        if (!lock?.id || lock.status === status) {
            return;
        }

        setUpdatingStatus(true);
        try {
            await apiFetch(`/api/maintenance/locks/${lock.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });

            await fetchDetail();
        } catch {
            // Keep current status rendered if request fails.
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="py-5 w-full px-5">
            <div className="mx-auto max-w-auto space-y-4">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/systems/rooms')}
                            aria-label="Volver al rack"
                            title="Volver al rack"
                            className="p-2.5 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Cerradura</p>
                            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                                Hab. {lock?.room_number || roomId}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Registrar evento
                        </button>
                        <button
                            type="button"
                            onClick={fetchDetail}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
                            title="Recargar"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                        {error}
                    </div>
                )}

                <div className="grid gap-4 lg:grid-cols-[0.85fr_1.65fr] items-start">
                    <aside className="space-y-4">
                        <section className="overflow-hidden rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-secondary)] shadow-sm">
                            <SectionTitle icon={BatteryFull} title="Predicción de batería" />
                            <div className="p-3 space-y-3">
                                <div className="rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-bg-primary)]/30 p-2.5">
                                    <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                                        <span className="inline-flex items-center gap-1.5"><Activity className="h-3 w-3" />Salud de batería</span>
                                    </div>
                                    <HealthBar score={prediction?.health_score} />
                                </div>

                                <div className="grid gap-2 grid-cols-2">
                                    <DetailMetric label="Últ. cambio" value={formatDate(prediction?.last_battery_change)} icon={Calendar} />
                                    <DetailMetric
                                        label="Próx. estimado"
                                        value={prediction ? `${formatDate(prediction.estimated_next_change)}` : 'Sin datos'}
                                        icon={Clock3}
                                        tone={prediction?.days_remaining <= 0 ? 'text-red-400' : prediction?.days_remaining <= 15 ? 'text-amber-400' : 'text-[var(--color-text-primary)]'}
                                    />
                                    <DetailMetric label="Promedio" value={prediction?.avg_days_between_changes ? `${prediction.avg_days_between_changes} d` : '—'} icon={Activity} />
                                    <DetailMetric label="Restantes" value={prediction ? `${prediction.days_remaining} días` : '—'} icon={AlertCircle} tone={prediction?.days_remaining <= 0 ? 'text-red-400' : 'text-[var(--color-text-primary)]'} />
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-secondary)] shadow-sm">
                            <SectionTitle icon={ShieldAlert} title="Estado y resumen" />
                            <div className="p-3 space-y-3">
                                <div className="rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-bg-primary)]/30 p-2.5">
                                    <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                                        <Activity className="h-3 w-3" />
                                        <span>Estado actual</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(LOCK_STATUS_LABELS).map(([value, label]) => {
                                            const active = lock?.status === value;
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    onClick={() => handleUpdateLockStatus(value)}
                                                    disabled={!lock?.id || updatingStatus}
                                                    className={`rounded-md border px-2 py-1 text-[10px] uppercase tracking-wide font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${active
                                                        ? `${LOCK_STATUS_STYLES[value]}`
                                                        : 'border-[var(--color-border)]/60 bg-[var(--color-bg-primary)]/30 text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]'
                                                        }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                                    <DetailMetric label="Módulo" value={lock?.module_name || '—'} icon={DoorOpen} />
                                    <DetailMetric label="Piso" value={lock?.floor_code || '—'} icon={MapPin} />
                                    <DetailMetric label="Código" value={lock?.code || `ROOM-${roomId}`} icon={Hash} />
                                    <DetailMetric label="Últ. mant." value={formatDate(lock?.last_maintenance_at)} icon={Calendar} />
                                    <DetailMetric label="Eventos" value={orderedEvents.length} icon={Activity} />
                                    <DetailMetric label="Últ. tipo" value={lastEvent?.type === 'battery' ? 'Batería' : lastEvent?.type === 'mechanical' ? 'Mecánico' : '—'} icon={Wrench} />
                                </div>
                            </div>
                        </section>
                    </aside>

                    <section className="overflow-hidden rounded-xl border border-[var(--color-border)]/80 bg-[var(--color-bg-secondary)] shadow-sm flex flex-col">
                        <SectionTitle
                            icon={Clock3}
                            title="Historial de mantenimiento"
                            rightElement={
                                <span className="text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-primary)]/50 px-2 py-0.5 rounded-full border border-[var(--color-border)]/50">
                                    {orderedEvents.length} eventos
                                </span>
                            }
                        />

                        <div className="p-4 flex-1">
                            {orderedEvents.length === 0 ? (
                                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)]/80 bg-[var(--color-bg-primary)]/20 text-center">
                                    <Calendar className="h-8 w-8 text-[var(--color-text-muted)] opacity-50" />
                                    <p className="text-xs text-[var(--color-text-secondary)]">Esta cerradura aún no tiene eventos registrados.</p>
                                </div>
                            ) : (
                                <div className="relative space-y-0 before:absolute before:inset-y-0 before:left-4 before:w-px before:border-l before:border-dashed before:border-[var(--color-border)]/60">
                                    {orderedEvents.map((event, index) => {
                                        const isBattery = event.type === 'battery';
                                        const isLast = index === orderedEvents.length - 1;

                                        return (
                                            <div key={event.id} className={`relative flex gap-4 ${isLast ? '' : 'pb-5'}`}>
                                                <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[var(--color-bg-secondary)] shadow-sm ${isBattery ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
                                                    <div className={`flex h-5 w-5 items-center justify-center rounded-full ${isBattery ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
                                                        {isBattery ? <Battery className="h-2.5 w-2.5 text-emerald-400" /> : <Wrench className="h-2.5 w-2.5 text-amber-400" />}
                                                    </div>
                                                </div>

                                                <div className="group flex-1 overflow-hidden rounded-lg border border-[var(--color-border)]/50 bg-gradient-to-br from-[var(--color-bg-primary)]/30 to-[var(--color-bg-secondary)]/10 transition-all hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-bg-primary)]/40 hover:shadow-sm">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)]/30 px-3 py-1.5 bg-[var(--color-bg-primary)]/20">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[11px] font-semibold uppercase tracking-wider ${isBattery ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                                {isBattery ? 'Batería' : 'Mecánico'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] font-medium">
                                                            <Calendar className="h-3 w-3" />
                                                            {formatDate(event.performed_at)}
                                                        </div>
                                                    </div>

                                                    <div className="px-3 py-2">
                                                        {event.description ? (
                                                            <p className="text-xs leading-relaxed text-[var(--color-text-primary)]/90">
                                                                {event.description}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs italic text-[var(--color-text-muted)]">Sin descripción</p>
                                                        )}

                                                        <div className="mt-2.5 flex flex-wrap gap-2">
                                                            {event.part_name && (
                                                                <div className="flex items-center gap-1 rounded-md bg-[var(--color-bg-primary)]/40 px-1.5 py-0.5 border border-[var(--color-border)]/40">
                                                                    <DoorOpen className="h-[10px] w-[10px] text-[var(--color-primary)]/70" />
                                                                    <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">{event.part_name}</span>
                                                                </div>
                                                            )}
                                                            {event.user_name && (
                                                                <div className="flex items-center gap-1 rounded-md bg-[var(--color-bg-primary)]/40 px-1.5 py-0.5 border border-[var(--color-border)]/40">
                                                                    <User className="h-[10px] w-[10px] text-[var(--color-primary)]/70" />
                                                                    <span className="text-[10px] font-medium text-[var(--color-text-secondary)]">{event.user_name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {showCreate && (
                <CreateLockEventModal
                    onSave={handleCreateEvent}
                    onCancel={() => setShowCreate(false)}
                    saving={savingEvent}
                    initialRoomId={roomId}
                    lockRoomSelection
                />
            )}
        </div>
    );
}
