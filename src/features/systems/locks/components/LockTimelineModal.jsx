import React, { useState } from 'react';
import { DoorOpen, Plus, RefreshCw, ShieldAlert, Calendar, Battery, User, BatteryFull, AlertCircle, Radio, Wrench, StickyNote, Edit3, Save, X } from 'lucide-react';
import Modal from '@shared/common/Modal';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import { apiFetch } from '@utils/api';
import { LOCK_STATUS_STYLES, LOCK_STATUS_LABELS } from '../utils/lockConstants';
import { formatShortDate } from '../utils/lockHelpers';

export default function LockTimelineModal({
    selectedLock,
    events,
    selectedPrediction,
    detailLoading,
    onClose,
    onCreateEvent,
    onRefresh,
}) {
    const [editingNotes, setEditingNotes] = useState(false);
    const [localNotes, setLocalNotes] = useState(selectedLock?.notes || '');
    const [savingNotes, setSavingNotes] = useState(false);

    if (!selectedLock) return null;

    const handleSaveNotes = async () => {
        setSavingNotes(true);
        try {
            await apiFetch(`/api/maintenance/locks/${selectedLock.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ notes: localNotes }),
            });
            setEditingNotes(false);
            if (onRefresh) onRefresh();
        } catch {
            // silently fail
        } finally {
            setSavingNotes(false);
        }
    };

    const handleCancelNotes = () => {
        setLocalNotes(selectedLock.notes || '');
        setEditingNotes(false);
    };

    return (
        <Modal isOpen={true} onClose={onClose} size="xl">
            <div className="-mx-6 -mt-4 flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/30 px-4 py-3 mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        <DoorOpen className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="flex items-center gap-2 text-[13px] font-bold tracking-tight text-[var(--color-text-primary)] sm:text-sm">
                            Hab. {selectedLock.room_number}
                            <span className="text-xs font-normal opacity-40 text-[var(--color-text-muted)]">|</span>
                            <span className="text-[9px] font-medium text-[var(--color-text-muted)] sm:text-[10px]">{selectedLock.module_name} – {selectedLock.floor_code}</span>
                            <span className={`rounded-full border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide sm:text-[8px] ${LOCK_STATUS_STYLES[selectedLock.status] || LOCK_STATUS_STYLES.operational}`}>
                                {LOCK_STATUS_LABELS[selectedLock.status] || 'Operativa'}
                            </span>
                        </h3>
                        <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] opacity-75">{selectedLock.code}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onCreateEvent}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3 py-1.5 text-[10px] font-semibold text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]/20 hover:border-[var(--color-primary)]/50"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Registrar evento
                    </button>
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]/50 text-[var(--color-text-muted)] transition-all hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
                        title="Recargar"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {detailLoading ? (
                <LoadingSpinner size="sm" />
            ) : (
                <div className="grid gap-4 lg:grid-cols-[1.55fr_0.95fr]">

                    <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40">
                        <div className="flex items-center justify-between border-b border-[var(--color-border)]/50 bg-[var(--color-bg-primary)]/20 px-4 py-3">
                            <h4 className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-primary)] sm:text-[10px]">
                                <ShieldAlert className="h-3 w-3 text-[var(--color-primary)]" />
                                Historial completo
                            </h4>
                            <span className="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-[8px] font-bold text-[var(--color-primary)] sm:text-[9px]">
                                {events.length} {events.length === 1 ? 'registro' : 'registros'}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar">
                            {events.length === 0 ? (
                                <div className="flex min-h-[310px] flex-col items-center justify-center gap-2 text-center opacity-60">
                                    <Calendar className="h-10 w-10 text-[var(--color-text-muted)] opacity-50" />
                                    <p className="text-[10px] font-medium text-[var(--color-text-muted)] sm:text-[11px]">Esta cerradura aún no tiene eventos registrados.</p>
                                </div>
                            ) : (
                                <div className="relative space-y-3 before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[var(--color-border)] before:to-transparent">
                                    {events.map((event) => (
                                        <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-[var(--color-bg-secondary)] bg-[var(--color-bg-primary)] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                                                {event.type === 'battery' ? <Battery className="h-4 w-4 text-emerald-400" /> : event.type === 'reprogramming' ? <Radio className="h-4 w-4 text-purple-400" /> : <Wrench className="h-4 w-4 text-amber-400" />}
                                            </div>
                                            <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2rem)] p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm transition-all hover:shadow-md hover:border-[var(--color-border-hover)]">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${event.type === 'battery' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : event.type === 'reprogramming' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                        {event.type === 'battery' ? 'Batería' : event.type === 'reprogramming' ? 'Reprogramación' : 'Mecánico'}
                                                    </span>
                                                    <time className="flex items-center gap-1 text-[9px] font-bold text-[var(--color-text-muted)]">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatShortDate(event.performed_at)}
                                                    </time>
                                                </div>
                                                {event.part_name && (
                                                    <div className="mb-2 inline-flex items-center rounded-lg bg-[var(--color-bg-primary)]/50 px-2 py-1 text-[10px]">
                                                        <span className="font-medium text-[var(--color-text-muted)] mr-1">Pieza:</span>
                                                        <span className="font-semibold text-[var(--color-text-primary)]">{event.part_name}</span>
                                                    </div>
                                                )}
                                                {event.description && (
                                                    <p className="text-[10px] leading-relaxed text-[var(--color-text-secondary)] sm:text-[11px]">{event.description}</p>
                                                )}
                                                {event.user_name && (
                                                    <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--color-border)]/50 pt-2.5 text-[10px] font-medium text-[var(--color-text-muted)]">
                                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                                            <User className="h-3 w-3" />
                                                        </div>
                                                        {event.user_name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3.5">
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 p-3.5">
                            <h4 className="mb-2.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-primary)] sm:text-[10px]">
                                <BatteryFull className="h-3 w-3 text-[var(--color-primary)]" />
                                Predicción de batería
                            </h4>
                            <div className="space-y-2.5">
                                <div className="rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/35 p-3">
                                    <div className="mb-1.5 flex items-center justify-between text-[8px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] sm:text-[9px]">
                                        <span className="flex items-center gap-1"><BatteryFull className="h-3 w-3" />Salud</span>
                                        <span className="text-[var(--color-text-primary)]">{selectedPrediction ? `${selectedPrediction.health_score}%` : 'N/A'}</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-[var(--color-border)]">
                                        <div
                                            className={`h-2 rounded-full transition-all ${!selectedPrediction ? 'bg-zinc-600' : selectedPrediction.health_score > 60 ? 'bg-emerald-500' : selectedPrediction.health_score > 30 ? 'bg-amber-400' : 'bg-red-500'}`}
                                            style={{ width: `${selectedPrediction?.health_score ?? 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="rounded-xl border border-[var(--color-border)]/70 bg-[var(--color-bg-primary)]/35 p-3">
                                    <div className="mb-1 flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] sm:text-[9px]">
                                        <Calendar className="h-3 w-3" />Próximo cambio
                                    </div>
                                    <div className="text-[13px] font-bold text-[var(--color-text-primary)] sm:text-sm">
                                        {selectedPrediction
                                            ? (selectedPrediction.days_remaining <= 0
                                                ? <span className="text-red-400">{Math.abs(selectedPrediction.days_remaining)}d vencida</span>
                                                : `${selectedPrediction.days_remaining}d restantes`)
                                            : 'Sin datos'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 p-3.5">
                            <div className="mb-2.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[var(--color-text-primary)] sm:text-[10px]">
                                <span className="flex items-center gap-1.5">
                                    <AlertCircle className="h-3 w-3 text-[var(--color-primary)]" />
                                    Estado y resumen
                                </span>
                            </div>

                            {selectedLock.notes && !editingNotes && (
                                <div className="mb-3 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-bg-primary)]/30 p-2.5">
                                    <div className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                                        <StickyNote className="h-3 w-3" />
                                        Nota guardada
                                    </div>
                                    <p className="text-[10px] leading-relaxed text-[var(--color-text-secondary)]">{selectedLock.notes}</p>
                                </div>
                            )}

                            {!editingNotes ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLocalNotes(selectedLock.notes || '');
                                        setEditingNotes(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-primary)]/20 px-3 py-2 text-[10px] font-medium text-[var(--color-text-secondary)] transition-all hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] w-full justify-center"
                                >
                                    <Edit3 className="h-3 w-3" />
                                    {selectedLock.notes ? 'Editar observación' : 'Agregar observación'}
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

                            <div className="mt-3 grid gap-1.5">
                                <div className="flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 border border-[var(--color-border)]/50">
                                    <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Total eventos</span>
                                    <span className="text-sm font-bold text-[var(--color-text-primary)]">{events.length}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 border border-[var(--color-border)]/50">
                                    <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Último evento</span>
                                    <span className="text-[10px] font-bold text-[var(--color-text-primary)]">{events.length > 0 ? formatShortDate(events[0].performed_at) : '—'}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 border border-[var(--color-border)]/50">
                                    <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Últ. mant.</span>
                                    <span className="text-[10px] font-bold text-[var(--color-text-primary)]">{formatShortDate(selectedLock.last_maintenance_at)}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 border border-[var(--color-border)]/50">
                                    <span className="text-[9px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Últ. tipo</span>
                                    <span className="text-[10px] font-bold text-[var(--color-text-primary)]">{selectedLock.last_maintenance_type || '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </Modal>
    );
}
