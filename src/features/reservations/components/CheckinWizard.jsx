import { useState, useEffect } from 'react';
import {
    LogIn, Search, User, BedDouble, CreditCard,
    CheckCircle, ArrowLeft, ArrowRight, RefreshCw, AlertTriangle,
} from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';
import Input from '@shared/common/Input';
import { apiFetch } from '@utils/api';
import PaymentModal from '@features/reservations/components/PaymentModal';
import {
    RESERVATION_SOURCES,
    PAYMENT_METHODS, CHARGE_TYPES,
} from '@utils/constants';
import { formatDate, formatCurrency } from '@utils/formatters';

const STEPS = [
    { id: 1, label: 'Reserva', icon: BedDouble },
    { id: 2, label: 'Huésped', icon: User },
    { id: 3, label: 'Cargos y Pagos', icon: CreditCard },
    { id: 4, label: 'Confirmación', icon: CheckCircle },
];

export default function CheckinWizard({ isOpen, onClose, preselectedReservationId, onCheckinComplete }) {
    const [step, setStep] = useState(1);
    const [reservation, setReservation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [reservedList, setReservedList] = useState([]);

    const [guestForm, setGuestForm] = useState({
        phone: '',
        email: '',
        fiscal_name: '',
        fiscal_id: '',
        fiscal_address: '',
    });
    const [guestDirty, setGuestDirty] = useState(false);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [checkinResult, setCheckinResult] = useState(null);

    useEffect(() => {
        if (!isOpen) {
            reset();
            return;
        }
        if (preselectedReservationId) {
            loadReservation(preselectedReservationId);
            setStep(2);
        } else {
            setStep(1);
            fetchReservedList();
        }
    }, [isOpen, preselectedReservationId]);

    function reset() {
        setStep(1);
        setReservation(null);
        setError(null);
        setSearch('');
        setReservedList([]);
        setGuestForm({ phone: '', email: '', fiscal_name: '', fiscal_id: '', fiscal_address: '' });
        setGuestDirty(false);
        setIsProcessing(false);
        setCheckinResult(null);
        setShowPaymentModal(false);
    }

    async function fetchReservedList() {
        setIsLoading(true);
        try {
            const data = await apiFetch('/api/reception/reservations?status=reserved&limit=50');
            setReservedList(data.reservations || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function loadReservation(id) {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiFetch(`/api/reception/reservations/${id}`);
            const res = data.reservation || data;
            setReservation(res);
            setGuestForm({
                phone: res.guest_phone || '',
                email: res.guest_email || '',
                fiscal_name: res.guest_fiscal_name || '',
                fiscal_id: res.guest_fiscal_id || '',
                fiscal_address: res.guest_fiscal_address || '',
            });
            setGuestDirty(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }

    const filteredList = reservedList.filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            r.guest_name?.toLowerCase().includes(q) ||
            r.room_number?.toLowerCase().includes(q) ||
            r.guest_document?.toLowerCase().includes(q)
        );
    });

    function handleSelectReservation(r) {
        setReservation({
            ...r,
            guest_id: r.guest_id,
            guest_name: r.guest_name,
            guest_document_type: r.guest_document_type,
            guest_document_number: r.guest_document_number,
            guest_phone: r.guest_phone,
            guest_email: r.guest_email,
            guest_fiscal_name: r.guest_fiscal_name,
            guest_fiscal_id: r.guest_fiscal_id,
            guest_fiscal_address: r.guest_fiscal_address,
        });
        setGuestForm({
            phone: r.guest_phone || '',
            email: r.guest_email || '',
            fiscal_name: r.guest_fiscal_name || '',
            fiscal_id: r.guest_fiscal_id || '',
            fiscal_address: r.guest_fiscal_address || '',
        });
        setGuestDirty(false);
        setStep(2);
        setError(null);
    }

    function handleGuestChange(field, value) {
        setGuestForm((prev) => ({ ...prev, [field]: value }));
        setGuestDirty(true);
    }

    async function saveGuestData() {
        if (!reservation?.guest_id || !guestDirty) return;
        try {
            await apiFetch(`/api/reception/guests/${reservation.guest_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(guestForm),
            });
        } catch (err) {
            throw new Error('Error al actualizar datos del huésped: ' + err.message);
        }
    }

    function calculateChargesPreview() {
        if (!reservation) return [];
        const checkIn = new Date(reservation.check_in_date);
        const checkOut = new Date(reservation.check_out_date);
        const nights = Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
        const rate = reservation.nightly_rate_usd || 0;
        const multiplier = reservation.plan_multiplier || 1;
        const nightlyRate = rate * multiplier;
        const charges = [];

        for (let i = 0; i < nights; i++) {
            charges.push({
                concept: `Noche ${i + 1}`,
                type: 'room_night',
                quantity: 1,
                unitPrice: nightlyRate,
                total: nightlyRate,
            });
        }

        if (reservation.early_checkin) {
            const surchargeRate = 0.5;
            charges.push({
                concept: 'Early Check-in',
                type: 'early_checkin',
                quantity: 1,
                unitPrice: nightlyRate * surchargeRate,
                total: nightlyRate * surchargeRate,
            });
        }

        if (reservation.late_checkout) {
            const surchargeRate = 0.5;
            charges.push({
                concept: 'Late Checkout',
                type: 'late_checkout',
                quantity: 1,
                unitPrice: nightlyRate * surchargeRate,
                total: nightlyRate * surchargeRate,
            });
        }

        return charges;
    }

    const chargesPreview = calculateChargesPreview();
    const totalPreview = chargesPreview.reduce((sum, c) => sum + c.total, 0);

    async function handleNext() {
        setError(null);
        if (step === 2 && guestDirty) {
            setIsProcessing(true);
            try {
                await saveGuestData();
                setGuestDirty(false);
            } catch (err) {
                setError(err.message);
                setIsProcessing(false);
                return;
            }
            setIsProcessing(false);
        }
        if (step === 3) {
            await loadReservation(reservation.id);
        }
        setStep((s) => Math.min(s + 1, 4));
    }

    function handleBack() {
        setError(null);
        setStep((s) => Math.max(s - 1, 1));
    }

    async function handleConfirmCheckin() {
        setIsProcessing(true);
        setError(null);
        try {
            const result = await apiFetch(`/api/reception/reservations/${reservation.id}/checkin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            setCheckinResult(result);
            setStep(4);
        } catch (err) {
            setError(err.message || 'Error al hacer check-in');
        } finally {
            setIsProcessing(false);
        }
    }

    function handleFinish() {
        onCheckinComplete?.();
        onClose();
    }

    const r = reservation;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Check-in"
                icon={LogIn}
                size="xl"
            >
                {!checkinResult ? (
                    <div className="space-y-6">
                        <Stepper steps={STEPS} currentStep={step} />

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
                            </div>
                        ) : (
                            <>
                                {step === 1 && (
                                    <StepSelectReservation
                                        list={filteredList}
                                        search={search}
                                        onSearch={setSearch}
                                        onSelect={handleSelectReservation}
                                        onRefresh={fetchReservedList}
                                    />
                                )}
                                {step === 2 && r && (
                                    <StepGuestData
                                        reservation={r}
                                        guestForm={guestForm}
                                        onGuestChange={handleGuestChange}
                                    />
                                )}
                                {step === 3 && r && (
                                    <StepChargesPreview
                                        reservation={r}
                                        charges={chargesPreview}
                                        total={totalPreview}
                                        onAddPayment={() => setShowPaymentModal(true)}
                                    />
                                )}
                            </>
                        )}

                        {!isLoading && !checkinResult && (
                            <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
                                <div>
                                    {step > 1 && (
                                        <Button variant="ghost" onClick={handleBack} icon={ArrowLeft}>
                                            Atrás
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                                    {step < 3 && (
                                        <Button
                                            variant="primary"
                                            onClick={handleNext}
                                            disabled={step === 1 && !r}
                                            icon={ArrowRight}
                                            iconPosition="right"
                                        >
                                            Siguiente
                                        </Button>
                                    )}
                                    {step === 3 && (
                                        <Button
                                            variant="primary"
                                            onClick={handleConfirmCheckin}
                                            loading={isProcessing}
                                            icon={LogIn}
                                        >
                                            Confirmar Check-in
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <StepSuccess
                        result={checkinResult}
                        reservation={r}
                        onFinish={handleFinish}
                    />
                )}
            </Modal>

            {showPaymentModal && r && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    reservationId={r.id}
                    onPaymentCreated={() => {
                        setShowPaymentModal(false);
                        loadReservation(r.id);
                    }}
                />
            )}
        </>
    );
}

function Stepper({ steps, currentStep }) {
    return (
        <div className="flex items-center justify-between">
            {steps.map((s, idx) => {
                const Icon = s.icon;
                const isActive = currentStep === s.id;
                const isCompleted = currentStep > s.id;
                return (
                    <div key={s.id} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                                isActive
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                    : isCompleted
                                        ? 'border-[var(--color-success)] bg-[var(--color-success)]/10 text-[var(--color-success)]'
                                        : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                            }`}>
                                <Icon className="w-4 h-4" />
                            </div>
                            <span className={`text-[10px] mt-1 font-medium whitespace-nowrap ${
                                isActive ? 'text-[var(--color-primary)]' : isCompleted ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'
                            }`}>
                                {s.label}
                            </span>
                        </div>
                        {idx < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 mt-[-12px] ${
                                currentStep > s.id ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'
                            }`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function StepSelectReservation({ list, search, onSearch, onSelect, onRefresh }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-muted)]">Selecciona una reserva en estado <Badge variant="info">Reservada</Badge> para hacer check-in</p>
                <Button variant="ghost" size="sm" onClick={onRefresh} icon={RefreshCw} />
            </div>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                    type="text"
                    placeholder="Buscar por huésped, habitación o documento..."
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    className="input pl-9"
                />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
                {list.length === 0 ? (
                    <p className="text-sm text-center text-[var(--color-text-muted)] py-8">No hay reservas pendientes</p>
                ) : list.map((r) => (
                    <button
                        key={r.id}
                        type="button"
                        onClick={() => onSelect(r)}
                        className="w-full text-left p-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-semibold text-[var(--color-text-primary)]">{r.room_number}</span>
                                <span className="mx-2 text-[var(--color-text-muted)]">·</span>
                                <span className="text-sm text-[var(--color-text-primary)]">{r.guest_name}</span>
                                {r.guest_document && (
                                    <span className="text-xs text-[var(--color-text-muted)] ml-2">({r.guest_document})</span>
                                )}
                            </div>
                            <div className="text-xs text-[var(--color-text-muted)]">
                                {formatDate(r.check_in_date)} → {formatDate(r.check_out_date)}
                            </div>
                        </div>
                        {r.plan_name && (
                            <span className="text-xs text-[var(--color-text-muted)] mt-1 inline-block">{r.plan_name}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

function StepGuestData({ reservation, guestForm, onGuestChange }) {
    const r = reservation;
    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Datos de la Reserva</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <InfoPill label="Habitación" value={r.room_number} />
                    <InfoPill label="Check-in" value={formatDate(r.check_in_date)} />
                    <InfoPill label="Check-out" value={formatDate(r.check_out_date)} />
                    <InfoPill label="Plan" value={r.plan_name || 'Sin plan'} />
                    <InfoPill label="Huéspedes" value={r.num_guests} />
                    <InfoPill label="Origen" value={RESERVATION_SOURCES[r.source] || r.source} />
                </div>
                {(r.early_checkin || r.late_checkout) && (
                    <div className="flex gap-2 mt-3">
                        {r.early_checkin && <Badge variant="warning">Early Check-in</Badge>}
                        {r.late_checkout && <Badge variant="warning">Late Checkout</Badge>}
                    </div>
                )}
            </div>

            <div className="border-t border-[var(--color-border)] pt-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Datos del Huésped</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                    <InfoPill label="Nombre" value={r.guest_name} />
                    <InfoPill label="Documento" value={`${r.guest_document_type || ''}${r.guest_document_number || ''}`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Teléfono"
                        value={guestForm.phone}
                        onChange={(e) => onGuestChange('phone', e.target.value)}
                        placeholder="Teléfono del huésped"
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={guestForm.email}
                        onChange={(e) => onGuestChange('email', e.target.value)}
                        placeholder="Email del huésped"
                    />
                </div>
            </div>

            <div className="border-t border-[var(--color-border)] pt-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Datos Fiscales <span className="text-[var(--color-text-muted)] font-normal">(opcional)</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Razón Social / Nombre Fiscal"
                        value={guestForm.fiscal_name}
                        onChange={(e) => onGuestChange('fiscal_name', e.target.value)}
                        placeholder="Nombre o razón fiscal"
                    />
                    <Input
                        label="RIF / Cédula Fiscal"
                        value={guestForm.fiscal_id}
                        onChange={(e) => onGuestChange('fiscal_id', e.target.value)}
                        placeholder="J-XXXXXXXX-X"
                    />
                    <div className="md:col-span-2">
                        <Input
                            label="Dirección Fiscal"
                            value={guestForm.fiscal_address}
                            onChange={(e) => onGuestChange('fiscal_address', e.target.value)}
                            placeholder="Dirección fiscal completa"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepChargesPreview({ reservation, charges, total, onAddPayment }) {
    const r = reservation;
    const payments = r.payments || [];
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount_usd || 0), 0);
    const balance = total - totalPaid;

    return (
        <div className="space-y-5">
            <div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                    Cargos que se generarán al hacer check-in
                </h3>
                <div className="space-y-2">
                    {charges.map((c, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{c.concept}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    {CHARGE_TYPES[c.type] || c.type}
                                    {c.quantity > 1 ? ` × ${c.quantity}` : ''}
                                </p>
                            </div>
                            <p className="text-sm font-semibold">{formatCurrency(c.unitPrice)}</p>
                        </div>
                    ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">Total Estimado</span>
                    <span className="text-base font-bold text-[var(--color-primary)]">{formatCurrency(total)}</span>
                </div>
            </div>

            {payments.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Pagos Anticipados</h3>
                        <Button size="sm" variant="ghost" onClick={onAddPayment}>+ Agregar pago</Button>
                    </div>
                    <div className="space-y-2">
                        {payments.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">{PAYMENT_METHODS[p.payment_method] || p.payment_method}</p>
                                    <Badge variant={p.status === 'verified' ? 'success' : 'warning'}>{p.status === 'verified' ? 'Verificado' : 'Pendiente'}</Badge>
                                </div>
                                <p className="text-sm font-semibold">{formatCurrency(p.amount_usd)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)]">
                        <span className="text-sm text-[var(--color-text-secondary)]">Total Pagado</span>
                        <span className="text-sm font-semibold text-[var(--color-success)]">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--color-text-secondary)]">Balance</span>
                        <span className={`text-sm font-semibold ${balance > 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-success)]'}`}>
                            {formatCurrency(balance)}
                        </span>
                    </div>
                </div>
            )}

            {payments.length === 0 && (
                <div className="text-center py-3">
                    <p className="text-sm text-[var(--color-text-muted)] mb-2">No hay pagos registrados</p>
                    <Button variant="outline" size="sm" onClick={onAddPayment} icon={CreditCard}>
                        Registrar pago anticipado
                    </Button>
                </div>
            )}
        </div>
    );
}

function StepSuccess({ result, reservation, onFinish }) {
    return (
        <div className="text-center py-6 space-y-5">
            <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-[var(--color-success)]" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Check-in Exitoso</h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    La reserva ha sido registrada como check-in correctamente
                </p>
            </div>

            {reservation && (
                <div className="text-left bg-[var(--color-bg-tertiary)] rounded-lg p-4 space-y-2 max-w-sm mx-auto">
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">Huésped</span>
                        <span className="font-medium text-[var(--color-text-primary)]">{reservation.guest_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">Habitación</span>
                        <span className="font-medium text-[var(--color-text-primary)]">{reservation.room_number}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">Check-in</span>
                        <span className="font-medium text-[var(--color-text-primary)]">{formatDate(reservation.check_in_date)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-[var(--color-text-muted)]">Check-out</span>
                        <span className="font-medium text-[var(--color-text-primary)]">{formatDate(reservation.check_out_date)}</span>
                    </div>
                    {result?.folio_id && (
                        <div className="flex justify-between text-sm pt-2 border-t border-[var(--color-border)]">
                            <span className="text-[var(--color-text-muted)]">Folio</span>
                            <span className="font-semibold text-[var(--color-success)]"> creado</span>
                        </div>
                    )}
                </div>
            )}

            <Button variant="primary" onClick={onFinish} icon={CheckCircle}>
                Continuar
            </Button>
        </div>
    );
}

function InfoPill({ label, value }) {
    return (
        <div className="bg-[var(--color-bg-tertiary)] rounded-lg px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">{value || '—'}</p>
        </div>
    );
}