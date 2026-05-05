import { useState, useEffect, useCallback } from 'react';
import {
    DoorOpen, DollarSign, BedDouble, User, Calendar, ArrowRight,
    RefreshCw, CheckCircle, AlertTriangle, Calculator, Users,
} from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import Button from '@shared/common/Button';
import Input from '@shared/common/Input';
import Modal from '@shared/common/Modal';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import CustomDropdown from '@shared/common/CustomDropdown';
import { apiFetch, apiJson } from '@utils/api';
import { useRoomTypes, useReservationPlans, useBcvRate } from '@hooks/useSettings';
import { useGuests } from '@features/reception/hooks/useReception';
import { useQuote } from '@hooks/useQuote';
import { useOccupancyConfigs } from '@hooks/useOccupancyConfigs';
import { formatCurrency, formatDate } from '@utils/formatters';

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}
function addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

export default function WalkInsPage() {
    const { roomTypes } = useRoomTypes();
    const { plans } = useReservationPlans();
    const { bcvRate } = useBcvRate();
    const { guests, fetchGuests } = useGuests();
    const { quote, loading: quoteLoading, error: quoteError, fetchQuote, resetQuote } = useQuote();
    const { items: occupancyConfigs, fetchConfigs } = useOccupancyConfigs();

    // Quoter state
    const [selectedType, setSelectedType] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');
    const [occupancyCode, setOccupancyCode] = useState('SGL_DBL');
    const [nights, setNights] = useState(1);
    const [checkIn, setCheckIn] = useState(getTodayStr());
    const [checkOut, setCheckOut] = useState(addDays(getTodayStr(), 1));
    const [availableRooms, setAvailableRooms] = useState([]);
    const [roomsLoading, setRoomsLoading] = useState(false);

    // Walk-in form state
    const [showForm, setShowForm] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [guestSearch, setGuestSearch] = useState('');
    const [guestResults, setGuestResults] = useState([]);
    const [selectedGuest, setSelectedGuest] = useState(null);
    const [newGuest, setNewGuest] = useState({ full_name: '', id_document_type: 'V', id_document_number: '', phone: '', email: '' });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    // Auto-update check-out when nights change
    useEffect(() => {
        setCheckOut(addDays(checkIn, nights));
    }, [checkIn, nights]);

    // Dynamic quote
    useEffect(() => {
        if (!selectedType || !checkIn || !checkOut || checkIn >= checkOut) {
            resetQuote();
            return;
        }
        const params = {
            room_type_id: selectedType,
            check_in: checkIn,
            check_out: checkOut,
            occupancy_code: occupancyCode,
            num_adults: 2,
            num_children: 0,
        };
        if (selectedPlan) params.plan_id = selectedPlan;
        fetchQuote(params);
    }, [selectedType, checkIn, checkOut, occupancyCode, selectedPlan, fetchQuote, resetQuote]);

    // Fetch available rooms when criteria change
    const fetchAvailable = useCallback(async () => {
        if (!selectedType) return;
        setRoomsLoading(true);
        try {
            const data = await apiFetch(`/api/structure/rooms?status=active&room_type_id=${selectedType}`);
            setAvailableRooms(data.rooms || []);
        } catch {
            setAvailableRooms([]);
        } finally {
            setRoomsLoading(false);
        }
    }, [selectedType]);

    useEffect(() => {
        fetchAvailable();
    }, [fetchAvailable]);

    // Guest search
    useEffect(() => {
        if (!guestSearch.trim()) {
            setGuestResults([]);
            return;
        }
        const timeout = setTimeout(() => {
            fetchGuests({ q: guestSearch, limit: 10 }).catch(() => {});
        }, 300);
        return () => clearTimeout(timeout);
    }, [guestSearch, fetchGuests]);

    useEffect(() => {
        if (guests.length > 0 && guestSearch.trim()) {
            setGuestResults(guests.map(g => ({
                value: g.id.toString(),
                label: `${g.full_name} — ${g.id_document_type}${g.id_document_number}`,
                guest: g,
            })));
        }
    }, [guests, guestSearch]);

    const occupancyOptions = occupancyConfigs
        .filter((c) => c.is_active)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((c) => ({
            value: c.code,
            label: `${c.label} (${c.min_pax === c.max_pax ? c.min_pax : `${c.min_pax}-${c.max_pax}`} pax)`,
        }));

    const selectRoomForWalkIn = (room) => {
        setSelectedRoom(room);
        setShowForm(true);
        setError(null);
        setSuccess(null);
    };

    const handleCreateWalkIn = async () => {
        setError(null);
        setSuccess(null);
        setCreating(true);

        try {
            let guestId = selectedGuest?.id;

            // Create guest if not selected
            if (!guestId) {
                if (!newGuest.full_name || !newGuest.id_document_number) {
                    throw new Error('Nombre y documento del huésped son requeridos');
                }
                const guestRes = await apiJson('/api/reception/guests', {
                    method: 'POST',
                    body: newGuest,
                });
                guestId = guestRes.guest?.id || guestRes.id;
            }

            // Create reservation
            const resPayload = {
                guest_id: guestId,
                room_id: selectedRoom.id,
                plan_id: selectedPlan ? parseInt(selectedPlan) : null,
                check_in_date: checkIn,
                check_out_date: checkOut,
                num_guests: 1,
                source: 'walk_in',
                notes: 'Venta directa (walk-in)',
            };
            const resData = await apiJson('/api/reception/reservations', {
                method: 'POST',
                body: resPayload,
            });
            const reservationId = resData.reservation?.id || resData.id;

            // Auto check-in
            await apiJson(`/api/reception/reservations/${reservationId}/checkin`, { method: 'POST' });

            setSuccess(`Walk-in completado. Huésped registrado en hab. ${selectedRoom.room_number}`);
            setShowForm(false);
            setSelectedRoom(null);
            setSelectedGuest(null);
            setNewGuest({ full_name: '', id_document_type: 'V', id_document_number: '', phone: '', email: '' });
            setGuestSearch('');
            fetchAvailable();
        } catch (err) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    return (
        <PageWrapper title="Walk-ins / Venta Directa" subtitle="Cotizador rápido y venta sin reserva" icon={DoorOpen}>
            <div className="space-y-6">
                {/* BCV Rate widget */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <DollarSign className="w-5 h-5 text-[var(--color-primary)]" />
                    <div className="flex-1">
                        <p className="text-xs text-[var(--color-text-muted)]">Tasa BCV del día</p>
                        <p className="text-lg font-bold text-[var(--color-text-primary)]">
                            {bcvRate ? `1 USD = ${bcvRate.toFixed(2)} VES` : '—'}
                        </p>
                    </div>
                </div>

                {/* Quoter */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Tipo de habitación</label>
                        <select className="input w-full text-sm" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                            <option value="">Seleccionar...</option>
                            {roomTypes.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Ocupación</label>
                        <CustomDropdown
                            value={occupancyCode}
                            onChange={setOccupancyCode}
                            options={occupancyOptions}
                            placeholder="Ocupación"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Plan</label>
                        <select className="input w-full text-sm" value={selectedPlan} onChange={e => setSelectedPlan(e.target.value)}>
                            <option value="">Solo alojamiento</option>
                            {plans.map(p => (
                                <option key={p.id} value={p.id}>{p.name} (×{p.rate_multiplier})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Entrada</label>
                        <Input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Noches</label>
                        <Input type="number" min={1} max={30} value={nights} onChange={e => setNights(parseInt(e.target.value) || 1)} />
                    </div>
                </div>

                {/* Quote result */}
                {quoteLoading && (
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Calculando tarifa dinámica...
                    </div>
                )}
                {quoteError && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {quoteError}
                    </div>
                )}
                {quote && (
                    <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-4">
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">Noches</p>
                                <p className="text-lg font-bold text-[var(--color-text-primary)]">{quote.nights}</p>
                            </div>
                            <div className="text-[var(--color-text-muted)]">×</div>
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">Tarifa promedio/noche</p>
                                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                                    {formatCurrency(quote.total_nightly_usd / quote.nights)}
                                </p>
                            </div>
                            <div className="text-[var(--color-text-muted)]">=</div>
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">Total USD</p>
                                <p className="text-2xl font-bold text-[var(--color-primary)]">{formatCurrency(quote.grand_total_usd)}</p>
                            </div>
                            {bcvRate && (
                                <div>
                                    <p className="text-xs text-[var(--color-text-muted)]">Total VES</p>
                                    <p className="text-lg font-bold text-[var(--color-text-secondary)]">Bs. {(quote.grand_total_usd * bcvRate).toFixed(2)}</p>
                                </div>
                            )}
                        </div>
                        {quote.nightly_breakdown.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {quote.nightly_breakdown.map((night) => (
                                    <div key={night.date} className="px-2 py-1 rounded-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs">
                                        <span className="text-[var(--color-text-muted)]">{night.date}</span>
                                        <span className="ml-1 font-medium text-[var(--color-text-primary)]">{formatCurrency(night.rate_usd)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Available rooms */}
                {selectedType && (
                    <section>
                        <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <BedDouble className="w-4 h-4" />
                            Habitaciones disponibles
                        </h3>

                        {roomsLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <LoadingSpinner size="sm" />
                            </div>
                        ) : availableRooms.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                {availableRooms.map(room => (
                                    <button
                                        key={room.id}
                                        onClick={() => selectRoomForWalkIn(room)}
                                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-center hover:border-[var(--color-primary)]/40 transition-colors"
                                    >
                                        <p className="text-lg font-bold text-[var(--color-text-primary)]">{room.room_number}</p>
                                        <p className="text-[10px] text-[var(--color-text-muted)]">{room.floor_code}</p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-[var(--color-text-muted)]">No hay habitaciones disponibles de este tipo.</p>
                        )}
                    </section>
                )}
            </div>

            {/* Walk-in form modal */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title={`Walk-in — Hab. ${selectedRoom?.room_number}`}
                icon={DoorOpen}
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                        <Button variant="primary" icon={CheckCircle} loading={creating} onClick={handleCreateWalkIn}>
                            Crear y Check-in
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">{error}</div>
                    )}

                    {/* Reservation summary */}
                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[var(--color-text-muted)]">Habitación:</span>
                            <span className="font-medium">{selectedRoom?.room_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--color-text-muted)]">Entrada:</span>
                            <span>{formatDate(checkIn)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--color-text-muted)]">Salida:</span>
                            <span>{formatDate(checkOut)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--color-text-muted)]">Total:</span>
                            <span className="font-bold text-[var(--color-primary)]">{quote ? formatCurrency(quote.grand_total_usd) : '—'}</span>
                        </div>
                    </div>

                    {/* Guest selection */}
                    <div className="space-y-2">
                        <label className="text-xs text-[var(--color-text-muted)]">Buscar huésped existente</label>
                        <Input
                            placeholder="Nombre, cédula..."
                            value={guestSearch}
                            onChange={e => { setGuestSearch(e.target.value); setSelectedGuest(null); }}
                        />
                        {guestResults.length > 0 && !selectedGuest && (
                            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] max-h-32 overflow-y-auto">
                                {guestResults.map(g => (
                                    <button
                                        key={g.value}
                                        onClick={() => { setSelectedGuest(g.guest); setGuestSearch(g.guest.full_name); setGuestResults([]); }}
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-tertiary)] transition-colors"
                                    >
                                        {g.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {selectedGuest && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">{selectedGuest.full_name}</span>
                                <button onClick={() => { setSelectedGuest(null); setGuestSearch(''); }} className="ml-auto text-xs text-[var(--color-text-muted)] hover:text-red-400">Cambiar</button>
                            </div>
                        )}
                    </div>

                    {/* New guest form */}
                    {!selectedGuest && (
                        <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase">Nuevo huésped</p>
                            <Input label="Nombre completo" value={newGuest.full_name} onChange={e => setNewGuest(p => ({ ...p, full_name: e.target.value }))} />
                            <div className="grid grid-cols-3 gap-2">
                                <select className="input text-sm" value={newGuest.id_document_type} onChange={e => setNewGuest(p => ({ ...p, id_document_type: e.target.value }))}>
                                    <option value="V">V</option>
                                    <option value="E">E</option>
                                    <option value="P">P</option>
                                    <option value="J">J</option>
                                </select>
                                <div className="col-span-2">
                                    <Input placeholder="Número de documento" value={newGuest.id_document_number} onChange={e => setNewGuest(p => ({ ...p, id_document_number: e.target.value }))} />
                                </div>
                            </div>
                            <Input label="Teléfono" value={newGuest.phone} onChange={e => setNewGuest(p => ({ ...p, phone: e.target.value }))} />
                            <Input label="Email" type="email" value={newGuest.email} onChange={e => setNewGuest(p => ({ ...p, email: e.target.value }))} />
                        </div>
                    )}
                </div>
            </Modal>

            {success && (
                <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    {success}
                </div>
            )}
        </PageWrapper>
    );
}
