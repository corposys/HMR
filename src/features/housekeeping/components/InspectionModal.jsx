import { useState } from 'react';
import { CheckCircle, XCircle, FileText, BedDouble } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';

export default function InspectionModal({ assignment, isOpen, onClose, onApprove, onReject }) {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    if (!assignment) return null;

    const completedTime = assignment.completed_at
        ? new Date(assignment.completed_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
        : null;

    const handleAction = async (approved) => {
        setLoading(true);
        try {
            if (approved) {
                await onApprove(assignment.id, notes);
            } else {
                await onReject(assignment.id, notes);
            }
            setNotes('');
            onClose();
        } catch (err) {
            console.error('Inspection error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Inspección de Habitación"
            icon={FileText}
            size="md"
            footer={
                <div className="flex justify-between w-full">
                    <button
                        onClick={() => handleAction(false)}
                        disabled={loading}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all duration-150 disabled:opacity-40"
                    >
                        <XCircle className="w-3.5 h-3.5" />
                        Rechazar
                    </button>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={CheckCircle}
                        loading={loading}
                        onClick={() => handleAction(true)}
                    >
                        Aprobar
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500/10">
                            <BedDouble className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-lg font-bold">{assignment.room_number}</p>
                            {assignment.room_type_name && (
                                <p className="text-[10px] text-[var(--color-text-muted)]">{assignment.room_type_name}</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <p className="text-[var(--color-text-muted)] mb-0.5">Camarera</p>
                            <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: assignment.staff_color }} />
                                <span className="font-medium">{assignment.staff_name}</span>
                            </div>
                        </div>
                        {completedTime && (
                            <div>
                                <p className="text-[var(--color-text-muted)] mb-0.5">Completada</p>
                                <p className="font-medium">{completedTime}</p>
                            </div>
                        )}
                    </div>

                    {assignment.notes && (
                        <div className="mt-3 pt-3 border-t border-[var(--color-border)]/50">
                            <p className="text-[var(--color-text-muted)] mb-1 text-[10px] uppercase tracking-wider">Notas de limpieza</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">{assignment.notes}</p>
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                        Notas de inspección (opcional)
                    </label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Observaciones sobre la limpieza..."
                        rows={3}
                        className="input w-full text-sm rounded-lg resize-none"
                    />
                </div>
            </div>
        </Modal>
    );
}
