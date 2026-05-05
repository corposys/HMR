import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import Input from '@shared/common/Input';
import CustomDropdown from '@shared/common/CustomDropdown';
import { DOCUMENT_TYPES } from '@utils/constants';

export default function GuestEditModal({ guest, isOpen, onClose, onSaved }) {
    const [form, setForm] = useState({
        full_name: '',
        id_document_type: 'V',
        id_document_number: '',
        phone: '',
        email: '',
        nationality: '',
        address: '',
        notes: '',
        fiscal_name: '',
        fiscal_id: '',
        fiscal_address: '',
    });
    const [showFiscal, setShowFiscal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (guest && isOpen) {
            setForm({
                full_name: guest.full_name || '',
                id_document_type: guest.id_document_type || 'V',
                id_document_number: guest.id_document_number || '',
                phone: guest.phone || '',
                email: guest.email || '',
                nationality: guest.nationality || '',
                address: guest.address || '',
                notes: guest.notes || '',
                fiscal_name: guest.fiscal_name || '',
                fiscal_id: guest.fiscal_id || '',
                fiscal_address: guest.fiscal_address || '',
            });
            setShowFiscal(!!guest.fiscal_name || !!guest.fiscal_id || !!guest.fiscal_address);
            setError(null);
        }
    }, [guest, isOpen]);

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
            const result = await onSaved(guest.id, payload);
            if (result) onClose();
        } catch (err) {
            setError(err.message || 'Error al actualizar huésped');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Huésped"
            icon={Pencil}
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>Guardar</Button>
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
                    <div className="md:col-span-2">
                        <Input label="Nombre completo *" value={form.full_name} onChange={handleChange('full_name')} />
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
                            <Input label="Número *" value={form.id_document_number} onChange={handleChange('id_document_number')} />
                        </div>
                    </div>

                    <Input label="Teléfono *" value={form.phone} onChange={handleChange('phone')} type="tel" />

                    <Input label="Email" value={form.email} onChange={handleChange('email')} type="email" />

                    <Input label="Nacionalidad" value={form.nationality} onChange={handleChange('nationality')} />

                    <div className="md:col-span-2">
                        <Input label="Dirección" value={form.address} onChange={handleChange('address')} />
                    </div>

                    <div className="md:col-span-2">
                        <Input label="Notas" value={form.notes} onChange={handleChange('notes')} />
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
                            <Input label="Razón Social (Fiscal)" value={form.fiscal_name} onChange={handleChange('fiscal_name')} />
                            <Input label="RIF (Fiscal)" value={form.fiscal_id} onChange={handleChange('fiscal_id')} />
                            <div className="md:col-span-2">
                                <Input label="Dirección Fiscal" value={form.fiscal_address} onChange={handleChange('fiscal_address')} />
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    );
}