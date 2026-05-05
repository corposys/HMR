import { useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import Input from '@shared/common/Input';
import CustomDropdown from '@shared/common/CustomDropdown';
import { apiFetch } from '@utils/api';
import { CHARGE_TYPES } from '@utils/constants';
import { formatCurrency } from '@utils/formatters';

const CHARGE_TYPE_OPTIONS = Object.entries(CHARGE_TYPES).map(([k, v]) => ({ value: k, label: v }));

export default function ChargeModal({ isOpen, onClose, reservationId, onChargeCreated }) {
    const [form, setForm] = useState({
        concept: '',
        quantity: '1',
        unit_price_usd: '',
        charge_type: 'extra',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const quantity = parseInt(form.quantity) || 1;
    const unitPrice = parseFloat(form.unit_price_usd) || 0;
    const total = quantity * unitPrice;

    function handleChange(field) {
        return (e) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }));
            if (error) setError(null);
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.concept.trim()) {
            setError('El concepto es requerido');
            return;
        }
        if (!form.unit_price_usd || parseFloat(form.unit_price_usd) <= 0) {
            setError('El precio unitario es requerido');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                reservation_id: reservationId,
                concept: form.concept.trim(),
                quantity: parseInt(form.quantity) || 1,
                unit_price_usd: parseFloat(form.unit_price_usd),
                charge_type: form.charge_type,
            };
            await apiFetch('/api/reception/charges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            setForm({ concept: '', quantity: '1', unit_price_usd: '', charge_type: 'extra' });
            onChargeCreated?.();
            onClose();
        } catch (err) {
            setError(err.message || 'Error al agregar cargo');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Agregar Cargo"
            icon={Plus}
            size="md"
            footer={
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
                        Agregar Cargo
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

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Tipo de Cargo *</label>
                    <CustomDropdown
                        value={form.charge_type}
                        onChange={(v) => setForm((p) => ({ ...p, charge_type: v }))}
                        options={CHARGE_TYPE_OPTIONS}
                    />
                </div>

                <Input
                    label="Concepto *"
                    value={form.concept}
                    onChange={handleChange('concept')}
                    placeholder="Ej. Noche de habitación, early check-in..."
                    autoFocus
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="Cantidad"
                        type="number"
                        min="1"
                        value={form.quantity}
                        onChange={handleChange('quantity')}
                    />
                    <Input
                        label="Precio Unitario (USD) *"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.unit_price_usd}
                        onChange={handleChange('unit_price_usd')}
                        placeholder="0.00"
                    />
                </div>

                {total > 0 && (
                    <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--color-text-muted)]">Total</span>
                            <span className="font-semibold text-[var(--color-text-primary)]">
                                {formatCurrency(total)}
                            </span>
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
}