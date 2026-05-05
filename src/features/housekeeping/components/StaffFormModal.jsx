import { useState } from 'react';
import { Users, Check, ArrowRight, ArrowLeft, Palette, UserCircle } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';

const STEPS = [
    { key: 'info', label: 'Info', icon: UserCircle },
    { key: 'role', label: 'Rol', icon: Users },
    { key: 'confirm', label: 'Confirmar', icon: Check },
];

export default function StaffFormModal({ staff, colors, isOpen, onClose, onSubmit }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [fullName, setFullName] = useState(staff?.full_name || '');
    const [role, setRole] = useState(staff?.role || 'maid');
    const [color, setColor] = useState(staff?.color || colors[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const canProceed = () => {
        if (currentStep === 0) return fullName.trim().length >= 3;
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
            await onSubmit({ full_name: fullName.trim(), role, color });
            resetAndClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        setCurrentStep(0);
        setFullName('');
        setRole('maid');
        setColor(colors[0]);
        setError(null);
        onClose();
    };

    const handleClose = () => {
        if (!loading) resetAndClose();
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                                Nombre completo
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Ej: María Elena Pérez"
                                className="input w-full text-sm rounded-lg"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                                Color identificador
                            </label>
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded-full border-2 border-[var(--color-border)]"
                                    style={{ backgroundColor: color }}
                                />
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    {colors.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={`w-6 h-6 rounded-full transition-all duration-150 ${c === color ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-bg-primary)]' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-3">
                        <p className="text-xs text-[var(--color-text-muted)]">Selecciona el rol</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { key: 'maid', label: 'Camarera', desc: 'Limpieza de habitaciones' },
                                { key: 'supervisor', label: 'Supervisora', desc: 'Inspección y gestión' },
                            ].map(r => (
                                <button
                                    key={r.key}
                                    onClick={() => setRole(r.key)}
                                    className={`
                                        rounded-xl border px-4 py-3 text-left transition-all duration-150
                                        ${role === r.key
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                                            : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-hover)]'
                                        }
                                    `}
                                >
                                    <p className="text-sm font-bold">{r.label}</p>
                                    <p className="text-[10px] text-[var(--color-text-muted)]">{r.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                    style={{ backgroundColor: color }}
                                >
                                    {fullName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                </div>
                                <div>
                                    <p className="text-lg font-bold">{fullName}</p>
                                    <p className="text-[10px] text-[var(--color-text-muted)]">
                                        {role === 'supervisor' ? 'Supervisora' : 'Camarera'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <Palette className="w-3 h-3 text-[var(--color-text-muted)]" />
                                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-[var(--color-text-muted)]">{color}</span>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={staff ? 'Editar Miembro' : 'Nuevo Miembro'}
            icon={Users}
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
                            {staff ? 'Guardar' : 'Crear'}
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
