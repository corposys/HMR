import { useState } from 'react';
import { X, DoorOpen, Users, Clock, ShieldAlert } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import Input from '@shared/common/Input';
import CustomDropdown from '@shared/common/CustomDropdown';
import { HOUSEKEEPING_STATUS } from '@utils/constants';

const STATUS_OPTIONS = Object.entries(HOUSEKEEPING_STATUS).map(([key, val]) => ({
    value: key,
    label: val.label,
}));

export default function BlockRoomModal({ room, isOpen, onClose, onConfirm }) {
    const [reason, setReason] = useState('');
    const [untilDate, setUntilDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!room) return null;

    async function handleSubmit(e) {
        e.preventDefault();
        if (!reason.trim()) return;
        setIsSubmitting(true);
        try {
            await onConfirm({
                is_blocked: true,
                blocked_reason: reason.trim(),
                blocked_until: untilDate || null,
            });
            setReason('');
            setUntilDate('');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleUnblock() {
        setIsSubmitting(true);
        try {
            await onConfirm({
                is_blocked: false,
                blocked_reason: null,
                blocked_until: null,
            });
            setReason('');
            setUntilDate('');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={room.is_blocked ? 'Desbloquear Habitación' : 'Bloquear Habitación'} icon={DoorOpen} size="sm">
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                    <span className="text-2xl font-bold text-[var(--color-primary)]">{room.room_number}</span>
                    <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{room.room_type_name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">Módulo {room.module_number} · Piso {room.floor_code}</p>
                    </div>
                </div>

                {room.is_blocked ? (
                    <>
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-1">
                                <ShieldAlert className="w-4 h-4" />
                                Habitación bloqueada
                            </div>
                            {room.blocked_reason && (
                                <p className="text-sm text-[var(--color-text-secondary)]">{room.blocked_reason}</p>
                            )}
                            {room.blocked_until && (
                                <p className="text-xs text-[var(--color-text-muted)] mt-1">Hasta: {room.blocked_until}</p>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                            <Button variant="danger" onClick={handleUnblock} loading={isSubmitting}>Desbloquear</Button>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Motivo del bloqueo"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ej: Reparación de plomería"
                            required
                        />
                        <Input
                            label="Fecha estimada de desbloqueo (opcional)"
                            type="date"
                            value={untilDate}
                            onChange={(e) => setUntilDate(e.target.value)}
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
                            <Button variant="danger" type="submit" loading={isSubmitting} disabled={!reason.trim()}>Bloquear</Button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}