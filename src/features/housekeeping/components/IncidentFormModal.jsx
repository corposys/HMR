import { useState } from 'react';
import { AlertTriangle, ArrowRight, ArrowLeft, Check, BedDouble, FileText, ShieldAlert } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import { IncidentTypeSelector, SeveritySelector } from './IncidentBadge';

const STEPS = [
    { key: 'type', label: 'Tipo', icon: AlertTriangle },
    { key: 'details', label: 'Detalles', icon: FileText },
    { key: 'confirm', label: 'Confirmar', icon: Check },
];

export default function IncidentFormModal({ room, assignmentId, staffId, isOpen, onClose, onSubmit }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [incidentType, setIncidentType] = useState('');
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('low');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!room) return null;

    const canProceed = () => {
        if (currentStep === 0) return !!incidentType;
        if (currentStep === 1) return !!description.trim();
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
                room_id: room.id,
                assignment_id: assignmentId,
                staff_id: staffId,
                incident_type: incidentType,
                description: description.trim(),
                severity,
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
        setIncidentType('');
        setDescription('');
        setSeverity('low');
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
                    <div className="space-y-3">
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Selecciona el tipo de incidencia para la habitación <strong>{room.room_number}</strong>
                        </p>
                        <IncidentTypeSelector value={incidentType} onChange={setIncidentType} />
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                                Descripción de la incidencia
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Describe el problema encontrado..."
                                rows={3}
                                className="input w-full text-sm rounded-lg resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-muted)] mb-1.5 block">
                                Severidad
                            </label>
                            <SeveritySelector value={severity} onChange={setSeverity} />
                        </div>
                    </div>
                );
            case 2: {
                const typeLabels = {
                    broken_item: 'Artículo roto',
                    missing_inventory: 'Falta inventario',
                    maintenance_needed: 'Mantenimiento',
                    guest_belongings: 'Objetos huésped',
                    damage: 'Daño',
                    other: 'Otro',
                };
                const severityLabels = { low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica' };

                return (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-500/10">
                                    <BedDouble className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">{room.room_number}</p>
                                    {room.room_type_name && (
                                        <p className="text-[10px] text-[var(--color-text-muted)]">{room.room_type_name}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--color-text-muted)]">Tipo</span>
                                    <span className="font-medium">{typeLabels[incidentType]}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--color-text-muted)]">Severidad</span>
                                    <span className="font-medium">{severityLabels[severity]}</span>
                                </div>
                                <div className="pt-2 border-t border-[var(--color-border)]/50">
                                    <p className="text-[var(--color-text-muted)] mb-1">Descripción</p>
                                    <p className="text-[var(--color-text-secondary)]">{description}</p>
                                </div>
                            </div>
                        </div>

                        {severity === 'critical' && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                Se creará un ticket de mantenimiento urgente automáticamente
                            </div>
                        )}
                        {incidentType === 'maintenance_needed' && severity !== 'low' && (
                            <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-xs text-orange-400">
                                <ShieldAlert className="w-4 h-4 shrink-0" />
                                Se creará un ticket de mantenimiento automáticamente
                            </div>
                        )}
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
            title="Reportar Incidencia"
            icon={AlertTriangle}
            size="md"
            footer={
                <div className="flex justify-between w-full">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0 || loading}
                        className={`
                            flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150
                            ${currentStep === 0 || loading
                                ? 'text-[var(--color-text-muted)]/40 cursor-not-allowed'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                            }
                        `}
                    >
                        <ArrowLeft className="w-3 h-3" />
                        Anterior
                    </button>

                    <div className="flex items-center gap-2">
                        {STEPS.map((step, index) => (
                            <div
                                key={step.key}
                                className={`
                                    flex items-center gap-1 text-[10px] font-medium transition-all duration-150
                                    ${index === currentStep
                                        ? 'text-[var(--color-primary)]'
                                        : index < currentStep
                                        ? 'text-emerald-400'
                                        : 'text-[var(--color-text-muted)]/40'
                                    }
                                `}
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
                            className={`
                                flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150
                                ${canProceed()
                                    ? 'text-[var(--color-primary)] hover:bg-[var(--color-bg-secondary)]'
                                    : 'text-[var(--color-text-muted)]/40 cursor-not-allowed'
                                }
                            `}
                        >
                            Siguiente
                            <ArrowRight className="w-3 h-3" />
                        </button>
                    ) : (
                        <Button
                            variant="primary"
                            size="sm"
                            icon={Check}
                            loading={loading}
                            onClick={handleSubmit}
                        >
                            Reportar
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
