import { useState } from 'react';
import { Wand2, BedDouble, Users, Check, Loader2 } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import { apiFetch } from '@utils/api';

export default function AutoAssignModal({ isOpen, onClose, onAssigned }) {
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [step, setStep] = useState('preview');

    const handlePreview = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/api/housekeeping/assignments/auto-assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            setPreview(data);
            setStep('confirm');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = () => {
        onAssigned?.();
        resetAndClose();
    };

    const resetAndClose = () => {
        setPreview(null);
        setError(null);
        setStep('preview');
        onClose();
    };

    const handleClose = () => {
        if (!loading) resetAndClose();
    };

    const groupedByStaff = preview?.assignments?.reduce((acc, a) => {
        if (!acc[a.staff_name]) acc[a.staff_name] = [];
        acc[a.staff_name].push(a.room_number);
        return acc;
    }, {}) || {};

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Auto-Asignar Habitaciones"
            icon={Wand2}
            size="md"
            footer={
                <div className="flex justify-between w-full">
                    {step === 'preview' && (
                        <div className="w-full flex justify-end">
                            <Button
                                variant="primary"
                                size="sm"
                                icon={loading ? Loader2 : Wand2}
                                loading={loading}
                                onClick={handlePreview}
                            >
                                Generar asignación
                            </Button>
                        </div>
                    )}
                    {step === 'confirm' && (
                        <div className="flex justify-between w-full">
                            <button
                                onClick={resetAndClose}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                            >
                                Cancelar
                            </button>
                            <Button
                                variant="primary"
                                size="sm"
                                icon={Check}
                                onClick={handleConfirm}
                            >
                                Confirmar asignación
                            </Button>
                        </div>
                    )}
                </div>
            }
        >
            <div className="space-y-3">
                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {step === 'preview' && (
                    <div className="text-center py-6">
                        <Wand2 className="w-12 h-12 mx-auto mb-3 text-[var(--color-primary)] opacity-40" />
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Distribuirá las habitaciones sucias equitativamente entre el personal activo
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 opacity-60">
                            Se prioriza la carga actual de cada camarera
                        </p>
                    </div>
                )}

                {step === 'confirm' && preview && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                            <BedDouble className="w-4 h-4 text-[var(--color-primary)]" />
                            <span className="text-sm font-bold">{preview.assignments.length} habitaciones</span>
                            <span className="text-[10px] text-[var(--color-text-muted)]">a asignar</span>
                        </div>

                        <div className="space-y-2">
                            {Object.entries(groupedByStaff).map(([name, rooms]) => (
                                <div
                                    key={name}
                                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                                        <span className="text-xs font-bold">{name}</span>
                                        <span className="text-[10px] text-[var(--color-text-muted)] ml-auto">
                                            {rooms.length} hab
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {rooms.map(room => (
                                            <span
                                                key={room}
                                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-0.5 text-[10px] font-medium"
                                            >
                                                <BedDouble className="w-2.5 h-2.5" />
                                                {room}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
