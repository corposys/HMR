import { useState } from 'react';
import { ArrowUpDown, Check, ArrowRight, ArrowLeft, Package, Hash, FileText } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';

const TRANSACTION_TYPES = [
    { key: 'restock', label: 'Reabastecimiento', icon: Package, color: 'text-emerald-400' },
    { key: 'checkout', label: 'Salida (uso)', icon: ArrowUpDown, color: 'text-blue-400' },
    { key: 'return', label: 'Devolución', icon: ArrowRight, color: 'text-cyan-400' },
    { key: 'loss', label: 'Pérdida', icon: Hash, color: 'text-red-400' },
];

const FLOORS = [
    { id: 1, code: 'P1', name: 'Piso 1' },
    { id: 2, code: 'P2', name: 'Piso 2' },
    { id: 3, code: 'P3', name: 'Piso 3' },
    { id: 4, code: 'P4', name: 'Piso 4' },
    { id: 5, code: 'P5', name: 'Piso 5' },
    { id: 6, code: 'P6', name: 'Piso 6' },
];

const STEPS = [
    { key: 'type', label: 'Tipo', icon: ArrowUpDown },
    { key: 'details', label: 'Detalles', icon: FileText },
    { key: 'confirm', label: 'Confirmar', icon: Check },
];

export default function LinenTransactionModal({ linenTypes, isOpen, onClose, onSubmit }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [transactionType, setTransactionType] = useState('');
    const [linenTypeId, setLinenTypeId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [floorId, setFloorId] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const canProceed = () => {
        if (currentStep === 0) return !!transactionType;
        if (currentStep === 1) return !!linenTypeId && !!quantity && Number(quantity) > 0;
        return true;
    };

    const handleNext = () => {
        if (canProceed() && currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            await onSubmit({
                linen_type_id: Number(linenTypeId),
                transaction_type: transactionType,
                quantity: Number(quantity),
                floor_id: floorId ? Number(floorId) : null,
                notes: notes.trim() || null,
            });
            resetAndClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        setCurrentStep(0);
        setTransactionType('');
        setLinenTypeId('');
        setQuantity('');
        setFloorId('');
        setNotes('');
        setError(null);
        onClose();
    };

    const handleClose = () => {
        if (!loading) resetAndClose();
    };

    const selectedLinen = linenTypes.find(l => String(l.id) === linenTypeId);

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-3">
                        <p className="text-xs text-[var(--color-text-muted)]">Selecciona el tipo de movimiento</p>
                        <div className="grid grid-cols-2 gap-2">
                            {TRANSACTION_TYPES.map(t => {
                                const Icon = t.icon;
                                const isSelected = t.key === transactionType;
                                return (
                                    <button
                                        key={t.key}
                                        onClick={() => setTransactionType(t.key)}
                                        className={`
                                            flex items-center gap-2 rounded-xl border px-3 py-3 text-left transition-all duration-150
                                            ${isSelected
                                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                                                : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-hover)]'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-5 h-5 shrink-0 ${t.color}`} />
                                        <span className="text-sm font-medium">{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                                Tipo de lencería
                            </label>
                            <select
                                value={linenTypeId}
                                onChange={e => setLinenTypeId(e.target.value)}
                                className="input w-full text-sm rounded-lg"
                            >
                                <option value="">-- Seleccionar --</option>
                                {linenTypes.map(l => (
                                    <option key={l.id} value={l.id}>{l.name} ({l.unit})</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    placeholder="0"
                                    className="input w-full text-sm rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                                    Piso (opcional)
                                </label>
                                <select
                                    value={floorId}
                                    onChange={e => setFloorId(e.target.value)}
                                    className="input w-full text-sm rounded-lg"
                                >
                                    <option value="">-- General --</option>
                                    {FLOORS.map(f => (
                                        <option key={f.id} value={f.id}>{f.code} - {f.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                                Notas (opcional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Observaciones..."
                                rows={2}
                                className="input w-full text-sm rounded-lg resize-none"
                            />
                        </div>
                    </div>
                );
            case 2: {
                const typeLabels = { restock: 'Reabastecimiento', checkout: 'Salida (uso)', return: 'Devolución', loss: 'Pérdida' };
                return (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--color-text-muted)]">Tipo</span>
                                    <span className="font-medium">{typeLabels[transactionType]}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--color-text-muted)]">Lencería</span>
                                    <span className="font-medium">{selectedLinen?.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--color-text-muted)]">Cantidad</span>
                                    <span className="font-bold text-lg">{quantity}</span>
                                </div>
                                {floorId && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-[var(--color-text-muted)]">Piso</span>
                                        <span className="font-medium">{FLOORS.find(f => String(f.id) === floorId)?.code}</span>
                                    </div>
                                )}
                                {notes && (
                                    <div className="pt-2 border-t border-[var(--color-border)]/50">
                                        <p className="text-[var(--color-text-muted)] mb-1">Notas</p>
                                        <p className="text-[var(--color-text-secondary)]">{notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }
            default:
                return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Nueva Transacción"
            icon={ArrowUpDown}
            size="md"
            footer={
                <div className="flex justify-between w-full">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0 || loading}
                        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${currentStep === 0 || loading ? 'text-[var(--color-text-muted)]/40 cursor-not-allowed' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'}`}
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Anterior
                    </button>

                    <div className="flex items-center gap-2">
                        {STEPS.map((step, index) => (
                            <div
                                key={step.key}
                                className={`flex items-center gap-1 text-[10px] font-medium transition-all duration-150 ${index === currentStep ? 'text-[var(--color-primary)]' : index < currentStep ? 'text-emerald-400' : 'text-[var(--color-text-muted)]/40'}`}
                            >
                                <step.icon className="w-3 h-3" />
                                <span className="hidden sm:inline">{step.label}</span>
                            </div>
                        ))}
                    </div>

                    {currentStep < STEPS.length - 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${canProceed() ? 'text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)]' : 'text-[var(--color-text-muted)]/40 cursor-not-allowed'}`}
                        >
                            Siguiente
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    ) : (
                        <Button variant="primary" size="sm" icon={Check} loading={loading} onClick={handleSubmit}>
                            Registrar
                        </Button>
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
                {renderStepContent()}
            </div>
        </Modal>
    );
}
