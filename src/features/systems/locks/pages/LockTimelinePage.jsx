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
    Radio,
} from 'lucide-react';
import { apiFetch } from '@utils/api';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import Button from '@shared/common/Button';
import { Card, CardHeader } from '@/components/ui/card';
import CreateLockEventModal from '@features/systems/locks/components/CreateLockEventModal';
import { LOCK_STATUS_STYLES, LOCK_STATUS_LABELS, LOCK_STATUS_DOT_STYLES } from '@features/systems/locks/utils/lockConstants';
import { formatDate } from '@features/systems/locks/utils/lockHelpers';
import { HealthBar, DetailMetric, SectionTitle } from '@features/systems/locks/components/LockSharedComponents';

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
        } catch (err) {
            setError(err.message || 'Error al registrar evento');
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

    const statusDotClass = LOCK_STATUS_DOT_STYLES[lock?.status] || LOCK_STATUS_DOT_STYLES.operational;
    const statusLabel = LOCK_STATUS_LABELS[lock?.status] || LOCK_STATUS_LABELS.operational;

    return (
        <div className="py-5 w-full px-3 sm:px-5">
            <div className="mx-auto max-w-auto space-y-4">
                <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
                    <CardHeader className="py-3 px-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                                <div className="flex items-center gap-2">
                                    <h1 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">
                                        Hab. {lock?.room_number || roomId}
                                    </h1>
                                    <span className="text-[10px] sm:text-xs uppercase tracking-wider text-[var(--color-text-muted)]">CERRADURA</span>
                                    <span className={`inline-flex h-2 w-2 rounded-full ${statusDotClass}`} title={statusLabel} />
                                    <span className="text-[10px] sm:text-xs font-medium text-[var(--color-text-muted)]">{statusLabel}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 justify-end">
                                <Button
                                    variant="register"
                                    icon={Plus}
                                    onClick={() => setShowCreate(true)}
                                    className="h-8 px-3 sm:px-4 !text-xs"
                                >
                                    <span className="hidden sm:inline">Registrar evento</span>
                                    <span className="sm:hidden">Evento</span>
                                </Button>
                                <button
                                    type="button"
                                    onClick={fetchDetail}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
                                    title="Recargar"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                        {error}
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-[0.85fr_1.65fr] items-start">
                    <aside className="grid gap-4 sm:grid-cols-1 lg:space-y-0">
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
                                    <DetailMetric label="Últ. tipo" value={(() => { if (!lastEvent) return '—'; if (lastEvent.type === 'battery') return 'Batería'; if (lastEvent.type === 'reprogramming') return 'Reprogramación'; return 'Mecánico'; })()} icon={Wrench} />
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
                                        const eventType = event.type === 'battery' ? 'battery' : event.type === 'reprogramming' ? 'reprogramming' : 'mechanical';
                                        const eventColors = {
                                            battery: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: Battery },
                                            reprogramming: { border: 'border-purple-500/30', bg: 'bg-purple-500/15', text: 'text-purple-400', icon: Radio },
                                            mechanical: { border: 'border-amber-500/30', bg: 'bg-amber-500/15', text: 'text-amber-400', icon: Wrench },
                                        };
                                        const EventIcon = eventColors[eventType].icon;
                                        const isLast = index === orderedEvents.length - 1;

                                        return (
                                            <div key={event.id} className={`relative flex gap-4 ${isLast ? '' : 'pb-5'}`}>
                                                <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-[var(--color-bg-secondary)] shadow-sm ${eventColors[eventType].border}`}>
                                                    <div className={`flex h-5 w-5 items-center justify-center rounded-full ${eventColors[eventType].bg}`}>
                                                        <EventIcon className="h-2.5 w-2.5" />
                                                    </div>
                                                </div>

                                                <div className="group flex-1 overflow-hidden rounded-lg border border-[var(--color-border)]/50 bg-gradient-to-br from-[var(--color-bg-primary)]/30 to-[var(--color-bg-secondary)]/10 transition-all hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-bg-primary)]/40 hover:shadow-sm">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)]/30 px-3 py-1.5 bg-[var(--color-bg-primary)]/20">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-[11px] font-semibold uppercase tracking-wider ${eventColors[eventType].text}`}>
                                                                {eventType === 'battery' ? 'Batería' : eventType === 'reprogramming' ? 'Reprogramación' : 'Mecánico'}
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
