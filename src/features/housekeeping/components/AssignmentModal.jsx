import { useState, useMemo } from 'react';
import { UserPlus, BedDouble, Check, ArrowRight, ArrowLeft, Users, Grid } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import { getKanbanStatus } from '../hooks/useHousekeeping';

const STEPS = [
    { key: 'staff', label: 'Camarera', icon: Users },
    { key: 'rooms', label: 'Habitaciones', icon: Grid },
    { key: 'confirm', label: 'Confirmar', icon: Check },
];

export default function AssignmentModal({ rooms, staff, isOpen, onClose, onAssign }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedStaffId, setSelectedStaffId] = useState('');
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [staffFilter, setStaffFilter] = useState('');

    const dirtyRooms = useMemo(() => {
        return rooms.filter(r => {
            const status = getKanbanStatus(r);
            if (status !== 'dirty') return false;
            if (r.housekeeping_status === 'maintenance') return false;
            return true;
        });
    }, [rooms]);

    const activeStaff = staff.filter(s => s.is_active);
    const filteredStaff = staffFilter
        ? activeStaff.filter(s => s.full_name.toLowerCase().includes(staffFilter.toLowerCase()))
        : activeStaff;

    const selectedStaff = activeStaff.find(s => String(s.id) === selectedStaffId);

    const handleSelectAll = () => {
        if (selectedRooms.length === dirtyRooms.length) {
            setSelectedRooms([]);
        } else {
            setSelectedRooms(dirtyRooms.map(r => r.id));
        }
    };

    const toggleRoom = (roomId) => {
        setSelectedRooms(prev =>
            prev.includes(roomId)
                ? prev.filter(id => id !== roomId)
                : [...prev, roomId]
        );
    };

    const canProceed = () => {
        if (currentStep === 0) return !!selectedStaffId;
        if (currentStep === 1) return selectedRooms.length > 0;
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
        if (!selectedStaffId || selectedRooms.length === 0) return;
        setLoading(true);
        setError(null);
        try {
            await onAssign(Number(selectedStaffId), selectedRooms);
            resetAndClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetAndClose = () => {
        setCurrentStep(0);
        setSelectedStaffId('');
        setSelectedRooms([]);
        setError(null);
        setStaffFilter('');
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
                        <input
                            type="text"
                            placeholder="Buscar camarera..."
                            value={staffFilter}
                            onChange={e => setStaffFilter(e.target.value)}
                            className="input w-full text-sm rounded-lg"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto">
                            {filteredStaff.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedStaffId(String(s.id))}
                                    className={`
                                        flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-150
                                        ${String(s.id) === selectedStaffId
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-text-primary)]'
                                            : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                                        }
                                    `}
                                >
                                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                    <span className="truncate">{s.full_name}</span>
                                    <span className="text-[10px] text-[var(--color-text-muted)] ml-auto">
                                        {s.role === 'supervisor' ? 'Sup.' : 'Cam.'}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {filteredStaff.length === 0 && (
                            <div className="text-center py-4 text-xs text-[var(--color-text-muted)]">
                                No se encontraron camareras
                            </div>
                        )}
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--color-text-muted)]">
                                {selectedRooms.length} de {dirtyRooms.length} seleccionadas
                            </span>
                            <button
                                onClick={handleSelectAll}
                                className="text-[10px] text-[var(--color-primary)] hover:underline"
                            >
                                {selectedRooms.length === dirtyRooms.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                            </button>
                        </div>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5 max-h-[280px] overflow-y-auto">
                            {dirtyRooms.map(room => (
                                <button
                                    key={room.id}
                                    onClick={() => toggleRoom(room.id)}
                                    className={`
                                        flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all duration-150
                                        ${selectedRooms.includes(room.id)
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-text-primary)]'
                                            : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                                        }
                                    `}
                                >
                                    <BedDouble className="w-3 h-3" />
                                    {room.room_number}
                                </button>
                            ))}
                        </div>
                        {dirtyRooms.length === 0 && (
                            <div className="text-center py-4 text-xs text-[var(--color-text-muted)]">
                                No hay habitaciones sucias sin asignar
                            </div>
                        )}
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: selectedStaff?.color }} />
                                <div>
                                    <p className="text-sm font-semibold">{selectedStaff?.full_name}</p>
                                    <p className="text-[10px] text-[var(--color-text-muted)]">
                                        {selectedStaff?.role === 'supervisor' ? 'Supervisora' : 'Camarera'}
                                    </p>
                                </div>
                            </div>
                            <div className="border-t border-[var(--color-border)]/50 pt-3">
                                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                                    Habitaciones a asignar ({selectedRooms.length}):
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {selectedRooms.map(roomId => {
                                        const room = rooms.find(r => r.id === roomId);
                                        return room ? (
                                            <span
                                                key={roomId}
                                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-0.5 text-[10px] font-medium"
                                            >
                                                <BedDouble className="w-2.5 h-2.5" />
                                                {room.room_number}
                                            </span>
                                        ) : null;
                                    })}
                                </div>
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
            title="Asignar Camarera"
            icon={UserPlus}
            size="lg"
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
                            Asignar
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
