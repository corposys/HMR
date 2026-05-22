import React, { useState } from 'react';
import { DoorOpen, BatteryFull, Calendar, AlertCircle, Activity, MapPin, Hash, StickyNote, Edit3, ArrowRight, Save, X } from 'lucide-react';
import Modal from '@shared/common/Modal';
import { apiFetch } from '@utils/api';
import { HealthBar } from './LockSharedComponents';
import { LOCK_STATUS_STYLES, LOCK_STATUS_LABELS, LOCK_STATUS_DOT_STYLES } from '../utils/lockConstants';
import { formatShortDate } from '../utils/lockHelpers';

export default function LockQuickModal({
    lock,
    prediction,
    events,
    onClose,
    onUpdateStatus,
    onOpenDetail,
    onRefresh,
    updatingStatus,
}) {
    const [editingNotes, setEditingNotes] = useState(false);
    const [localNotes, setLocalNotes] = useState(lock.notes || '');
    const [savingNotes, setSavingNotes] = useState(false);

    if (!lock) return null;

    const statusKey = lock.status || 'operational';
    const statusLabel = LOCK_STATUS_LABELS[statusKey] || 'Operativa';
    const statusDotClass = LOCK_STATUS_DOT_STYLES[statusKey] || LOCK_STATUS_DOT_STYLES.operational;

    const handleVerDetalles = () => {
        if (onOpenDetail) onOpenDetail(lock.room_id || lock.id);
    };

    const handleSaveNotes = async () => {
        setSavingNotes(true);
        try {
            await apiFetch(`/api/maintenance/locks/${lock.id}`, {
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
        setLocalNotes(lock.notes || '');
        setEditingNotes(false);
    };

    const daysColor = !prediction
        ? 'text-[var(--color-text-muted)]'
        : prediction.days_remaining <= 0
            ? 'text-red-400'
            : prediction.days_remaining <= 15
                ? 'text-amber-400'
                : 'text-emerald-400';

    const statusOptions = Object.entries(LOCK_STATUS_LABELS);

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`Hab. ${lock.room_number}`}
            icon={DoorOpen}
            size="sm"
            footer={
                <div className="flex gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        type="button"
                        onClick={handleVerDetalles}
                        className="flex-1 py-2 text-sm rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        Ver detalles
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                {/* Status header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{statusLabel}</span>
                    </div>
                    {lock.code && (
                        <span className="text-xs text-[var(--color-text-muted)] font-mono">{lock.code}</span>
                    )}
                </div>

                {/* Segmented status control */}
                <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden divide-x divide-[var(--color-border)]">
                    {statusOptions.map(([value, label]) => {
                        const active = lock.status === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => onUpdateStatus(lock.id, value)}
                                disabled={updatingStatus}
                                className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wide transition-all disabled:opacity-50 ${
                                    active
                                        ? `${LOCK_STATUS_STYLES[value]}`
                                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* Battery compact */}
                <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
                            <BatteryFull className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                            Batería
                        </div>
                        <div className={`text-xs font-bold ${daysColor}`}>
                            {prediction
                                ? (prediction.days_remaining <= 0
                                    ? `${Math.abs(prediction.days_remaining)}d vencida`
                                    : `${prediction.days_remaining}d restantes`)
                                : 'Sin datos'}
                        </div>
                    </div>
                    <HealthBar score={prediction?.health_score} />
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2">
                    <InfoItem icon={MapPin} label="Módulo" value={lock.module_name || '—'} />
                    <InfoItem icon={Hash} label="Piso" value={lock.floor_code || '—'} />
                    <InfoItem icon={Calendar} label="Últ. mant." value={formatShortDate(lock.last_maintenance_at)} />
                    <InfoItem icon={Activity} label="Eventos" value={events.length} />
                </div>

                {/* Notes inline */}
                <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                            <StickyNote className="w-4 h-4 text-[var(--color-primary)]" />
                            Observaciones
                        </div>
                        {!editingNotes && (
                            <button
                                type="button"
                                onClick={() => {
                                    setLocalNotes(lock.notes || '');
                                    setEditingNotes(true);
                                }}
                                className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                            >
                                <Edit3 className="w-3 h-3" />
                                {lock.notes ? 'Editar' : 'Agregar'}
                            </button>
                        )}
                    </div>
                    {editingNotes ? (
                        <div className="space-y-2">
                            <textarea
                                value={localNotes}
                                onChange={(e) => setLocalNotes(e.target.value)}
                                rows={3}
                                placeholder="Ej: Marco desalineado, hay que empujar la puerta con fuerza..."
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none resize-none placeholder:text-[var(--color-text-muted)]"
                                autoFocus
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
                    ) : lock.notes ? (
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{lock.notes}</p>
                    ) : (
                        <p className="text-xs italic text-[var(--color-text-muted)]">Sin observaciones guardadas.</p>
                    )}
                </div>
            </div>
        </Modal>
    );
}

function InfoItem({ icon, label, value }) {
    const Icon = icon;
    return (
        <div className="flex items-center gap-2.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] px-3 py-2">
            <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] shrink-0">
                <Icon className="w-3.5 h-3.5" />
                <span className="text-xs">{label}</span>
            </div>
            <span className="text-xs font-semibold text-[var(--color-text-primary)] ml-auto">{value}</span>
        </div>
    );
}
