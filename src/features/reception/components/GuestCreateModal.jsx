import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import Input from '@shared/common/Input';
import CustomDropdown from '@shared/common/CustomDropdown';
import { DOCUMENT_TYPES } from '@utils/constants';

export default function GuestCreateModal({ isOpen, onClose, onCreated, express = false }) {
    const [form, setForm] = useState({
        full_name: '',
        id_document_type: 'V',
        id_document_number: '',
        phone: '',
        email: '',
        nationality: 'Venezolano',
        address: '',
        notes: '',
        fiscal_name: '',
        fiscal_id: '',
        fiscal_address: '',
    });
    const [showFiscal, setShowFiscal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const isExpress = express;

    function handleChange(field) {
        return (e) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }));
            if (error) setError(null);
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.full_name.trim() || !form.id_document_number.trim() || !form.phone.trim()) {
            setError('Nombre, documento y teléfono son requeridos');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                full_name: form.full_name.trim(),
                id_document_type: form.id_document_type,
                id_document_number: form.id_document_number.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || null,
                nationality: form.nationality.trim() || null,
                address: form.address.trim() || null,
                notes: form.notes.trim() || null,
                fiscal_name: showFiscal ? form.fiscal_name.trim() || null : null,
                fiscal_id: showFiscal ? form.fiscal_id.trim() || null : null,
                fiscal_address: showFiscal ? form.fiscal_address.trim() || null : null,
            };
            const result = await onCreated(payload);
            if (result?.id) {
                setForm({
                    full_name: '',
                    id_document_type: 'V',
                    id_document_number: '',
                    phone: '',
                    email: '',
                    nationality: 'Venezolano',
                    address: '',
                    notes: '',
                    fiscal_name: '',
                    fiscal_id: '',
                    fiscal_address: '',
                });
                setShowFiscal(false);
            }
        } catch (err) {
            setError(err.message || 'Error al crear huésped');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isExpress ? 'Registro Express' : 'Nuevo Huésped'}
            icon={UserPlus}
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
                        {isExpress ? 'Registrar' : 'Crear Huésped'}
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={isExpress ? 'md:col-span-2' : ''}>
                        <Input
                            label="Nombre completo *"
                            value={form.full_name}
                            onChange={handleChange('full_name')}
                            placeholder="Ej. Juan Pérez"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3">
                        <div className="w-24">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Documento *</label>
                            <CustomDropdown
                                value={form.id_document_type}
                                onChange={(v) => setForm((prev) => ({ ...prev, id_document_type: v }))}
                                options={DOCUMENT_TYPES}
                            />
                        </div>
                        <div className="flex-1">
                            <Input
                                label="Número *"
                                value={form.id_document_number}
                                onChange={handleChange('id_document_number')}
                                placeholder="12345678"
                            />
                        </div>
                    </div>

                    <Input
                        label="Teléfono *"
                        value={form.phone}
                        onChange={handleChange('phone')}
                        placeholder="04141234567"
                        type="tel"
                    />

                    {!isExpress && (
                        <>
                            <Input
                                label="Email"
                                value={form.email}
                                onChange={handleChange('email')}
                                placeholder="correo@ejemplo.com"
                                type="email"
                            />

                            <Input
                                label="Nacionalidad"
                                value={form.nationality}
                                onChange={handleChange('nationality')}
                                placeholder="Venezolano"
                            />

                            <div className="md:col-span-2">
                                <Input
                                    label="Dirección"
                                    value={form.address}
                                    onChange={handleChange('address')}
                                    placeholder="Dirección completa"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <Input
                                    label="Notas"
                                    value={form.notes}
                                    onChange={handleChange('notes')}
                                    placeholder="Observaciones sobre el huésped"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setShowFiscal(!showFiscal)}
                                    className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors"
                                >
                                    {showFiscal ? '− Ocultar datos fiscales' : '+ Agregar datos fiscales'}
                                </button>
                            </div>

                            {showFiscal && (
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border)]">
                                    <Input
                                        label="Razón Social (Fiscal)"
                                        value={form.fiscal_name}
                                        onChange={handleChange('fiscal_name')}
                                        placeholder="Empresa XYZ C.A."
                                    />
                                    <Input
                                        label="RIF (Fiscal)"
                                        value={form.fiscal_id}
                                        onChange={handleChange('fiscal_id')}
                                        placeholder="J-00000000-0"
                                    />
                                    <div className="md:col-span-2">
                                        <Input
                                            label="Dirección Fiscal"
                                            value={form.fiscal_address}
                                            onChange={handleChange('fiscal_address')}
                                            placeholder="Dirección fiscal completa"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </form>
        </Modal>
    );
}