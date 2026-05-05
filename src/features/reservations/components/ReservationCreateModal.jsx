import { useState, useEffect } from 'react';
import { CalendarPlus, AlertTriangle } from 'lucide-react';
import Modal from '@shared/common/Modal';
import Button from '@shared/common/Button';
import Input from '@shared/common/Input';
import CustomDropdown from '@shared/common/CustomDropdown';
import { useGuests } from '@features/reception/hooks/useReception';
import { useReservationPlans } from '@hooks/useSettings';
import { useQuote } from '@hooks/useQuote';
import { useOccupancyConfigs } from '@hooks/useOccupancyConfigs';
import { apiFetch } from '@utils/api';
import { formatCurrency } from '@utils/formatters';
import { RESERVATION_SOURCES, BRACELET_COLORS } from '@utils/constants';

export default function ReservationCreateModal({ isOpen, onClose, onCreated, preselectedGuest, preselectedRoom }) {
    const [form, setForm] = useState({
        guest_id: '',
        room_id: '',
        plan_id: '',
        check_in_date: '',
        check_out_date: '',
        num_guests: '1',
        source: 'walk_in',
        bracelet_color: '',
        early_checkin: false,
        late_checkout: false,
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [guestSearch, setGuestSearch] = useState('');
    const [guestResults, setGuestResults] = useState([]);

    const { guests, fetchGuests } = useGuests();
    const { plans } = useReservationPlans();
    const { quote, error: quoteError, fetchQuote, resetQuote } = useQuote();
    const { items: occupancyConfigs, fetchConfigs } = useOccupancyConfigs();

    const [roomDetail, setRoomDetail] = useState(null);
    const [occupancyCode, setOccupancyCode] = useState('SGL_DBL');

    useEffect(() => {
        if (isOpen) {
            setForm({
                guest_id: preselectedGuest?.id?.toString() || '',
                room_id: preselectedRoom?.id?.toString() || '',
                plan_id: '',
                check_in_date: new Date().toISOString().split('T')[0],
                check_out_date: '',
                num_guests: '1',
                source: 'walk_in',
                bracelet_color: '',
                early_checkin: false,
                late_checkout: false,
                notes: '',
            });
            setError(null);
            setRoomDetail(null);
            resetQuote();
            setGuestSearch(preselectedGuest ? (preselectedGuest.full_name || preselectedGuest.name || '') : '');
            if (preselectedGuest) {
                const initial = [{ value: preselectedGuest.id.toString(), label: `${preselectedGuest.full_name || preselectedGuest.name} — ${preselectedGuest.id_document_type || ''}${preselectedGuest.id_document_number || ''}` }];
                setGuestResults(initial);
            }
        }
    }, [isOpen, preselectedGuest, preselectedRoom, resetQuote]);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    useEffect(() => {
        if (!isOpen) return;
        if (!guestSearch.trim()) {
            setGuestResults([]);
            return;
        }
        const timeout = setTimeout(() => {
            fetchGuests({ q: guestSearch, limit: 20 }).then(() => {}).catch(() => {});
        }, 300);
        return () => clearTimeout(timeout);
    }, [guestSearch, isOpen]);

    useEffect(() => {
        if (guests.length > 0 && guestSearch.trim()) {
            setGuestResults(
                guests.map((g) => ({
                    value: g.id.toString(),
                    label: `${g.full_name} — ${g.id_document_type}${g.id_document_number}`,
                }))
            );
        }
    }, [guests]);

    // Fetch room detail to get room_type_id for quote
    useEffect(() => {
        if (!form.room_id) {
            setRoomDetail(null);
            return;
        }
        async function loadRoom() {
            try {
                const data = await apiFetch(`/api/structure/rooms/${form.room_id}`);
                setRoomDetail(data.room);
            } catch {
                setRoomDetail(null);
            }
        }
        loadRoom();
    }, [form.room_id]);

    // Fetch dynamic quote
    useEffect(() => {
        if (!roomDetail?.room_type_id || !form.check_in_date || !form.check_out_date || form.check_in_date >= form.check_out_date) {
            resetQuote();
            return;
        }
        const params = {
            room_type_id: roomDetail.room_type_id,
            check_in: form.check_in_date,
            check_out: form.check_out_date,
            occupancy_code: occupancyCode,
            num_adults: parseInt(form.num_guests) || 1,
            num_children: 0,
        };
        if (form.plan_id) params.plan_id = form.plan_id;
        fetchQuote(params);
    }, [roomDetail, form.check_in_date, form.check_out_date, form.plan_id, occupancyCode, form.num_guests, fetchQuote, resetQuote]);

    function handleChange(field) {
        return (e) => {
            setForm((prev) => ({ ...prev, [field]: e.target.value }));
            if (error) setError(null);
        };
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.guest_id || !form.room_id || !form.check_in_date || !form.check_out_date) {
            setError('Huésped, habitación, fecha de entrada y salida son requeridos');
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                guest_id: parseInt(form.guest_id),
                room_id: parseInt(form.room_id),
                plan_id: form.plan_id ? parseInt(form.plan_id) : null,
                check_in_date: form.check_in_date,
                check_out_date: form.check_out_date,
                num_guests: parseInt(form.num_guests) || 1,
                source: form.source,
                bracelet_color: form.bracelet_color || null,
                early_checkin: form.early_checkin,
                late_checkout: form.late_checkout,
                notes: form.notes.trim() || null,
            };
            await onCreated(payload);
            onClose();
        } catch (err) {
            setError(err.message || 'Error al crear reserva');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Nueva Reserva"
            icon={CalendarPlus}
            size="xl"
            footer={
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
                        Crear Reserva
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
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Huésped *</label>
                        <input
                            type="text"
                            placeholder="Buscar huésped..."
                            value={guestSearch}
                            onChange={(e) => { setGuestSearch(e.target.value); if (form.guest_id) setForm((p) => ({ ...p, guest_id: '' })); }}
                            className="input"
                        />
                        {form.guest_id && guestResults.find((g) => g.value === form.guest_id) && (
                            <p className="mt-1 text-xs text-[var(--color-success)]">
                                Seleccionado: {guestResults.find((g) => g.value === form.guest_id)?.label}
                            </p>
                        )}
                        {guestSearch && !form.guest_id && (
                            <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                                {guestResults.length > 0 ? guestResults.map((g) => (
                                    <button
                                        key={g.value}
                                        type="button"
                                        onClick={() => { setForm((p) => ({ ...p, guest_id: g.value })); setGuestSearch(g.label.split(' — ')[0]); }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-elevated)] transition-colors border-b border-[var(--color-border)] last:border-b-0"
                                    >
                                        {g.label}
                                    </button>
                                )) : (
                                    <p className="px-3 py-2 text-xs text-[var(--color-text-muted)]">Sin resultados</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Habitación *</label>
                        {preselectedRoom ? (
                            <input
                                type="text"
                                value={`${preselectedRoom.room_number} — ${preselectedRoom.room_type_name || ''}`}
                                readOnly
                                className="input bg-[var(--color-bg-tertiary)]"
                            />
                        ) : (
                            <input
                                type="number"
                                placeholder="ID de habitación"
                                value={form.room_id}
                                onChange={handleChange('room_id')}
                                className="input"
                            />
                        )}
                    </div>

                    <Input
                        label="Fecha Check-in *"
                        type="date"
                        value={form.check_in_date}
                        onChange={handleChange('check_in_date')}
                    />

                    <Input
                        label="Fecha Check-out *"
                        type="date"
                        value={form.check_out_date}
                        onChange={handleChange('check_out_date')}
                    />

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Plan</label>
                        <CustomDropdown
                            value={form.plan_id}
                            onChange={(v) => setForm((p) => ({ ...p, plan_id: v }))}
                            options={plans.map((p) => ({ value: p.id?.toString() || p.name, label: `${p.name} (${p.rate_multiplier}x)` }))}
                            placeholder="Sin plan"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Ocupación</label>
                        <CustomDropdown
                            value={occupancyCode}
                            onChange={setOccupancyCode}
                            options={occupancyConfigs.filter((c) => c.is_active).sort((a, b) => a.sort_order - b.sort_order).map((c) => ({
                                value: c.code,
                                label: `${c.label} (${c.min_pax === c.max_pax ? c.min_pax : `${c.min_pax}-${c.max_pax}`} pax)`,
                            }))}
                            placeholder="Ocupación"
                        />
                    </div>

                    <Input
                        label="Huéspedes"
                        type="number"
                        min="1"
                        max="10"
                        value={form.num_guests}
                        onChange={handleChange('num_guests')}
                    />

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Origen</label>
                        <CustomDropdown
                            value={form.source}
                            onChange={(v) => setForm((p) => ({ ...p, source: v }))}
                            options={Object.entries(RESERVATION_SOURCES).map(([k, v]) => ({ value: k, label: v }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Brazalete</label>
                        <CustomDropdown
                            value={form.bracelet_color}
                            onChange={(v) => setForm((p) => ({ ...p, bracelet_color: v }))}
                            options={[
                                { value: '', label: 'Sin brazalete' },
                                ...Object.entries(BRACELET_COLORS).map(([k, v]) => ({
                                    value: k,
                                    label: `${v.label} — ${v.description}`,
                                })),
                            ]}
                        />
                    </div>

                    {/* Dynamic quote preview */}
                    {quote && (
                        <div className="md:col-span-2 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Noches</p>
                                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{quote.nights}</p>
                                </div>
                                <div className="text-[var(--color-text-muted)]">×</div>
                                <div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Promedio/noche</p>
                                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{formatCurrency(quote.total_nightly_usd / quote.nights)}</p>
                                </div>
                                <div className="text-[var(--color-text-muted)]">=</div>
                                <div>
                                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Total USD</p>
                                    <p className="text-lg font-bold text-[var(--color-primary)]">{formatCurrency(quote.grand_total_usd)}</p>
                                </div>
                                {quote.plan_multiplier !== 1 && (
                                    <div className="ml-auto text-xs text-[var(--color-text-muted)]">
                                        Plan ×{quote.plan_multiplier}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {quoteError && (
                        <div className="md:col-span-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" />
                            {quoteError}
                        </div>
                    )}

                    <div className="flex items-center gap-6 md:col-span-2">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)]">
                            <input
                                type="checkbox"
                                checked={form.early_checkin}
                                onChange={(e) => setForm((p) => ({ ...p, early_checkin: e.target.checked }))}
                                className="w-4 h-4 rounded border-[var(--color-border)]"
                            />
                            Early Check-in
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)]">
                            <input
                                type="checkbox"
                                checked={form.late_checkout}
                                onChange={(e) => setForm((p) => ({ ...p, late_checkout: e.target.checked }))}
                                className="w-4 h-4 rounded border-[var(--color-border)]"
                            />
                            Late Check-out
                        </label>
                    </div>

                    <div className="md:col-span-2">
                        <Input
                            label="Notas"
                            value={form.notes}
                            onChange={handleChange('notes')}
                            placeholder="Observaciones sobre la reserva"
                        />
                    </div>
                </div>
            </form>
        </Modal>
    );
}