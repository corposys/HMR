import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Battery,
    Calendar,
    DoorOpen,
    ShieldAlert,
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
    StickyNote,
    Edit3,
    Save,
    X,
} from 'lucide-react';
import { apiFetch } from '@utils/api';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import Button from '@shared/common/Button';
import { Card, CardHeader } from '@/components/ui/card';
import CreateLockEventModal from '@features/systems/locks/components/CreateLockEventModal';
import { LOCK_STATUS_LABELS, LOCK_STATUS_DOT_STYLES } from '@features/systems/locks/utils/lockConstants';
import { formatDate } from '@features/systems/locks/utils/lockHelpers';
import { HealthBar, DetailMetric, SectionTitle } from '@features/systems/locks/components/LockSharedComponents';

export default function LockTimelinePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [lock, setLock] = useState(null);
    const [events, setEvents] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [savingEvent, setSavingEvent] = useState(false);
    const [editingNotes, setEditingNotes] = useState(false);
    const [localNotes, setLocalNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    const roomId = Number(id);

    const fetchDetail = useCallback(async (skipStateCheck = false) => {
        if (!Number.isFinite(roomId)) {
            setError('Habitación inválida');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        const stateData = !skipStateCheck ? location.state : null;

        try {
            let foundLock = stateData?.lock || null;
            let foundPrediction = stateData?.prediction || null;

            if (!foundLock || !foundPrediction) {
                const [locksData, predData] = await Promise.all([
                    apiFetch('/api/maintenance/locks'),
                    apiFetch('/api/maintenance/predictions'),
                ]);
                foundLock = (locksData.locks || []).find((item) => Number(item.room_id) === roomId) || null;
                foundPrediction = (predData.predictions || []).find((item) => Number(item.room_id) === roomId) || null;
            }

            setLock(foundLock);
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
    }, [roomId, location.state]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    useEffect(() => {
        setLocalNotes(lock?.notes || '');
    }, [lock?.notes]);

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
            };

            await apiFetch('/api/maintenance/batch', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            setShowCreate(false);
            await fetchDetail(true);
        } catch (err) {
            setError(err.message || 'Error al registrar evento');
        } finally {
            setSavingEvent(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!lock?.id) return;
        setSavingNotes(true);
        try {
            await apiFetch(`/api/maintenance/locks/${lock.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ notes: localNotes }),
            });
            setEditingNotes(false);
            await fetchDetail(true);
        } catch {
            // silently fail
        } finally {
            setSavingNotes(false);
        }
    };

    const handleCancelNotes = () => {
        setLocalNotes(lock?.notes || '');
        setEditingNotes(false);
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
                                {lock?.notes ? (
                                    <div className="rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-bg-primary)]/30 p-2.5">
                                        <div className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                                            <StickyNote className="h-3 w-3" />
                                            Observación
                                        </div>
                                        <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">{lock.notes}</p>
                                    </div>
                                ) : null}

                                {!editingNotes ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLocalNotes(lock?.notes || '');
                                            setEditingNotes(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-primary)]/20 px-3 py-2 text-[10px] font-medium text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] w-full justify-center"
                                    >
                                        <Edit3 className="h-3 w-3" />
                                        {lock?.notes ? 'Editar observación' : 'Agregar observación'}
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <textarea
                                            value={localNotes}
                                            onChange={(e) => setLocalNotes(e.target.value)}
                                            rows={3}
                                            placeholder="Ej: Marco desalineado, hay que empujar la puerta con fuerza..."
                                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none resize-none placeholder:text-[var(--color-text-muted)]"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={handleSaveNotes}
                                                disabled={savingNotes}
                                                className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                                            >
                                                {savingNotes ? (
                                                    <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                                                ) : (
                                                    <Save className="w-3 h-3" />
                                                )}
                                                Guardar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCancelNotes}
                                                disabled={savingNotes}
                                                className="flex-1 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                                            >
                                                <X className="w-3 h-3" />
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}

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

                        {orderedEvents.length === 0 ? (
                            <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
                                <Calendar className="h-8 w-8 text-[var(--color-text-muted)] opacity-50" />
                                <p className="text-xs text-[var(--color-text-secondary)]">Esta cerradura aún no tiene eventos registrados.</p>
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <table className="w-full text-left text-sm text-[var(--color-text-secondary)]">
                                    <thead className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">Tipo</th>
                                            <th scope="col" className="px-4 py-3 font-medium">Descripción</th>
                                            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap hidden md:table-cell">Pieza</th>
                                            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">Fecha</th>
                                            <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap hidden sm:table-cell">Técnico</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {orderedEvents.map((event) => {
                                            const eventType = event.type === 'battery' ? 'battery' : event.type === 'reprogramming' ? 'reprogramming' : 'mechanical';
                                            const eventColors = {
                                                battery: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: Battery },
                                                reprogramming: { border: 'border-purple-500/30', bg: 'bg-purple-500/15', text: 'text-purple-400', icon: Radio },
                                                mechanical: { border: 'border-amber-500/30', bg: 'bg-amber-500/15', text: 'text-amber-400', icon: Wrench },
                                            };
                                            const EventIcon = eventColors[eventType].icon;

                                            return (
                                                <tr key={event.id} className="hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${eventColors[eventType].border}`}>
                                                                <div className={`flex h-4 w-4 items-center justify-center rounded-full ${eventColors[eventType].bg}`}>
                                                                    <EventIcon className="h-2.5 w-2.5" />
                                                                </div>
                                                            </div>
                                                            <span className={`text-xs font-semibold uppercase tracking-wider ${eventColors[eventType].text}`}>
                                                                {eventType === 'battery' ? 'Batería' : eventType === 'reprogramming' ? 'Reprogramación' : 'Mecánico'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[var(--color-text-primary)]">
                                                        {event.description || <span className="italic text-[var(--color-text-muted)]">Sin descripción</span>}
                                                    </td>
                                                    <td className="px-4 py-3 hidden md:table-cell text-[var(--color-text-muted)]">
                                                        {event.part_name || <span className="italic">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-[var(--color-text-muted)] whitespace-nowrap">
                                                        {formatDate(event.performed_at)}
                                                    </td>
                                                    <td className="px-4 py-3 hidden sm:table-cell text-[var(--color-text-muted)]">
                                                        {event.user_name || <span className="italic">—</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
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
