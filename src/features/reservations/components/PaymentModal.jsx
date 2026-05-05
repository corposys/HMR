import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import Input from '@shared/common/Input';
import CustomDropdown from '@shared/common/CustomDropdown';
import { apiFetch } from '@utils/api';
import { useBcvRate } from '@hooks/useSettings';
import { PAYMENT_METHODS, PAYMENT_METHOD_CURRENCIES, IGTF_METHODS } from '@utils/constants';
import { formatCurrency } from '@utils/formatters';

export default function PaymentModal({ isOpen, onClose, reservationId, onPaymentCreated }) {
    const [form, setForm] = useState({
        amount_usd: '',
        payment_method: 'cash_usd',
        reference_number: '',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const { bcvRate, isLoading: rateLoading } = useBcvRate();
    const [screenshotFile, setScreenshotFile] = useState(null);
    const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

    const isIgtfMethod = IGTF_METHODS.includes(form.payment_method);
    const amount = parseFloat(form.amount_usd) || 0;
    const igtfRate = 0.03;
    const igtfAmount = isIgtfMethod ? amount * igtfRate : 0;
    const totalWithIgtf = amount + igtfAmount;
    const currency = PAYMENT_METHOD_CURRENCIES[form.payment_method] || 'USD';

    function handleChange(field) {
        return (e) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }));
            if (error) setError(null);
        };
    }

    async function handleScreenshotUpload() {
        if (!screenshotFile) return null;
        setUploadingScreenshot(true);
        try {
            const formData = new FormData();
            formData.append('file', screenshotFile);
            const data = await apiFetch('/api/reception/upload', {
                method: 'POST',
                headers: {},
                body: formData,
            });
            return data.url;
        } catch {
            return null;
        } finally {
            setUploadingScreenshot(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.amount_usd || parseFloat(form.amount_usd) <= 0) {
            setError('El monto es requerido');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            let screenshotUrl = null;
            if (screenshotFile) {
                screenshotUrl = await handleScreenshotUpload();
            }
            const payload = {
                reservation_id: reservationId,
                amount_usd: parseFloat(form.amount_usd),
                payment_method: form.payment_method,
                reference_number: form.reference_number.trim() || null,
                screenshot_url: screenshotUrl,
                notes: form.notes.trim() || null,
            };
            await apiFetch('/api/reception/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            setForm({ amount_usd: '', payment_method: 'cash_usd', reference_number: '', notes: '' });
            setScreenshotFile(null);
            onPaymentCreated?.();
            onClose();
        } catch (err) {
            setError(err.message || 'Error al registrar pago');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Registrar Pago"
            icon={CreditCard}
            size="md"
            footer={
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit} loading={isSubmitting || uploadingScreenshot}>
                        Registrar Pago
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

                <Input
                    label="Monto (USD) *"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={form.amount_usd}
                    onChange={handleChange('amount_usd')}
                    placeholder="0.00"
                    autoFocus
                />

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Método de Pago *</label>
                    <CustomDropdown
                        value={form.payment_method}
                        onChange={(v) => setForm((p) => ({ ...p, payment_method: v }))}
                        options={Object.entries(PAYMENT_METHODS).map(([k, v]) => ({ value: k, label: v }))}
                    />
                </div>

                {isIgtfMethod && amount > 0 && (
                    <div className="p-3 rounded-lg bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/20 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--color-text-secondary)]">IGTF (3%)</span>
                            <span className="font-medium">{formatCurrency(igtfAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                            <span>Total con IGTF</span>
                            <span>{formatCurrency(totalWithIgtf)}</span>
                        </div>
                    </div>
                )}

                {currency === 'VES' && !rateLoading && bcvRate?.rate && amount > 0 && (
                    <div className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--color-text-muted)]">Tasa BCV</span>
                            <span>{Number(bcvRate.rate).toFixed(2)} Bs/USD</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-[var(--color-text-muted)]">Equivalente en Bs</span>
                            <span className="font-medium">{Number(amount * bcvRate.rate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</span>
                        </div>
                    </div>
                )}

                {(form.payment_method === 'zelle' || form.payment_method === 'pago_movil' || form.payment_method === 'bank_transfer') && (
                    <Input
                        label="Número de Referencia"
                        value={form.reference_number}
                        onChange={handleChange('reference_number')}
                        placeholder="Ej. 2024-12345678"
                    />
                )}

                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Comprobante de Pago</label>
                    <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        onChange={(e) => setScreenshotFile(e.target.files[0] || null)}
                        className="block w-full text-sm text-[var(--color-text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[var(--color-bg-tertiary)] file:text-[var(--color-text-secondary)] hover:file:bg-[var(--color-bg-elevated)] cursor-pointer"
                    />
                    {screenshotFile && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">{screenshotFile.name}</p>
                    )}
                </div>

                <Input
                    label="Notas"
                    value={form.notes}
                    onChange={handleChange('notes')}
                    placeholder="Observaciones sobre el pago"
                />
            </form>
        </Modal>
    );
}