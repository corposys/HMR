import React from 'react';
import { DoorOpen, ArrowRight, Loader2 } from 'lucide-react';
import Modal from '@shared/common/Modal';
import { LOCK_STATUS_STYLES, LOCK_STATUS_LABELS, LOCK_STATUS_DOT_STYLES } from '../utils/lockConstants';

const STATUS_OPTIONS = [
    { value: 'operational', color: 'emerald' },
    { value: 'needs_review', color: 'amber' },
    { value: 'out_of_service', color: 'zinc' },
];

const ACTIVE_STYLES = {
    operational: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400',
    needs_review: 'bg-amber-500/10 border-amber-500/40 text-amber-400',
    out_of_service: 'bg-zinc-500/10 border-zinc-500/40 text-zinc-300',
};

export default function LockStatusPopover({
    lock,
    onUpdateStatus,
    onOpenDetail,
    onClose,
    updating,
}) {
    if (!lock) return null;

    const statusKey = lock.status || 'operational';
    const statusDotClass = LOCK_STATUS_DOT_STYLES[statusKey] || LOCK_STATUS_DOT_STYLES.operational;

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
                        className="flex-1 py-2.5 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    >
                        Cerrar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onOpenDetail(lock.room_id || lock.id);
                            onClose();
                        }}
                        className="flex-1 py-2.5 text-sm rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        Ver detalles
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1">
                    <span className={`inline-flex h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {LOCK_STATUS_LABELS[statusKey] || LOCK_STATUS_LABELS.operational}
                    </span>
                    {lock.code && (
                        <span className="text-xs text-[var(--color-text-muted)] font-mono ml-auto">
                            {lock.code}
                        </span>
                    )}
                </div>

                <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">
                        Cambiar estado
                    </label>
                    <div className="space-y-2">
                        {STATUS_OPTIONS.map(opt => {
                            const active = lock.status === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => onUpdateStatus(lock.id, opt.value)}
                                    disabled={updating}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left disabled:opacity-60 ${
                                        active
                                            ? ACTIVE_STYLES[opt.value]
                                            : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                                    }`}
                                >
                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                        active
                                            ? `border-current`
                                            : 'border-[var(--color-border)]'
                                    }`}>
                                        {active && (
                                            updating
                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                : <span className="h-2 w-2 rounded-full bg-current" />
                                        )}
                                    </span>
                                    <span className={`text-sm ${active ? 'font-semibold' : 'font-medium'}`}>
                                        {LOCK_STATUS_LABELS[opt.value]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
