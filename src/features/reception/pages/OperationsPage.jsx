import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Monitor, Search, BedDouble, User, Calendar, CheckCircle, Clock,
    LogIn, LogOut, ArrowRight, RefreshCw, AlertTriangle, DollarSign,
} from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';
import Input from '@shared/common/Input';
import Modal from '@shared/common/Modal';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import { apiFetch } from '@utils/api';
import CheckinWizard from '@features/reservations/components/CheckinWizard';
import { formatDate, formatCurrency } from '@utils/formatters';

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

export default function OperationsPage() {
    const [arrivals, setArrivals] = useState([]);
    const [inHouse, setInHouse] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');

    // Wizard / checkout modal state
    const [showWizard, setShowWizard] = useState(false);
    const [wizardReservationId, setWizardReservationId] = useState(null);
    const [selectedRes, setSelectedRes] = useState(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [folio, setFolio] = useState(null);
    const [folioLoading, setFolioLoading] = useState(false);
    const [processingCheckout, setProcessingCheckout] = useState(false);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const today = getTodayStr();
            const [arrData, houseData] = await Promise.all([
                apiFetch(`/api/reception/reservations?status=reserved&date_from=${today}&date_to=${today}&limit=100`),
                apiFetch(`/api/reception/reservations?status=checked_in&limit=200`),
            ]);
            setArrivals(arrData.reservations || []);
            setInHouse(houseData.reservations || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const filteredArrivals = useMemo(() => {
        if (!search.trim()) return arrivals;
        const q = search.toLowerCase();
        return arrivals.filter(r =>
            r.guest_name?.toLowerCase().includes(q) ||
            r.guest_document?.toLowerCase().includes(q) ||
            r.room_number?.toLowerCase().includes(q)
        );
    }, [arrivals, search]);

    const filteredDepartures = useMemo(() => {
        const today = getTodayStr();
        let deps = inHouse.filter(r => r.check_out_date === today);
        if (!search.trim()) return deps;
        const q = search.toLowerCase();
        return deps.filter(r =>
            r.guest_name?.toLowerCase().includes(q) ||
            r.guest_document?.toLowerCase().includes(q) ||
            r.room_number?.toLowerCase().includes(q)
        );
    }, [inHouse, search]);

    const filteredInHouse = useMemo(() => {
        let house = inHouse.filter(r => r.check_out_date !== getTodayStr());
        if (!search.trim()) return house;
        const q = search.toLowerCase();
        return house.filter(r =>
            r.guest_name?.toLowerCase().includes(q) ||
            r.guest_document?.toLowerCase().includes(q) ||
            r.room_number?.toLowerCase().includes(q)
        );
    }, [inHouse, search]);

    const stats = useMemo(() => ({
        arrivals: arrivals.length,
        arrivalsPending: arrivals.filter(r => r.status === 'reserved').length,
        departures: inHouse.filter(r => r.check_out_date === getTodayStr()).length,
        departuresPending: inHouse.filter(r => r.check_out_date === getTodayStr() && r.status === 'checked_in').length,
        inHouse: inHouse.length,
    }), [arrivals, inHouse]);

    // Check-in wizard
    const openCheckIn = (id) => {
        setWizardReservationId(id);
        setShowWizard(true);
    };

    const handleWizardClose = () => {
        setShowWizard(false);
        setWizardReservationId(null);
        fetchAll();
    };

    // Check-out modal
    const openCheckout = async (res) => {
        setSelectedRes(res);
        setShowCheckout(true);
        setFolioLoading(true);
        try {
            const data = await apiFetch(`/api/reception/folios/${res.id}`);
            setFolio(data.folio || null);
        } catch {
            setFolio(null);
        } finally {
            setFolioLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (!selectedRes) return;
        setProcessingCheckout(true);
        try {
            await apiFetch(`/api/reception/reservations/${selectedRes.id}/checkout`, { method: 'POST' });
            setShowCheckout(false);
            setSelectedRes(null);
            setFolio(null);
            fetchAll();
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessingCheckout(false);
        }
    };

    return (
        <PageWrapper title="Check-in/out" subtitle="Llegadas, salidas y huéspedes en estancia" icon={Monitor}>
            <div className="space-y-4">
                {/* Global stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <StatCard
                        icon={LogIn}
                        label="Llegadas hoy"
                        value={stats.arrivals}
                        sub={`${stats.arrivalsPending} pendientes`}
                        color="emerald"
                    />
                    <StatCard
                        icon={LogOut}
                        label="Salidas hoy"
                        value={stats.departures}
                        sub={`${stats.departuresPending} pendientes`}
                        color="amber"
                    />
                    <StatCard
                        icon={BedDouble}
                        label="En estancia"
                        value={stats.inHouse}
                        color="blue"
                    />
                    <StatCard
                        icon={CheckCircle}
                        label="Ocupación"
                        value={`${Math.round((stats.inHouse / 96) * 100)}%`}
                        sub="96 hab."
                        color="purple"
                    />
                </div>

                {/* Search + Refresh */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 max-w-md">
                        <Input
                            icon={Search}
                            placeholder="Buscar huésped, cédula o habitación..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchAll} title="Actualizar" />
                </div>

                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Arrivals */}
                        <Section
                            title="Llegadas Hoy"
                            icon={LogIn}
                            count={filteredArrivals.length}
                            pending={filteredArrivals.filter(r => r.status === 'reserved').length}
                            color="emerald"
                        >
                            {filteredArrivals.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {filteredArrivals.map(res => (
                                        <GuestCard
                                            key={res.id}
                                            reservation={res}
                                            variant="arrival"
                                            onAction={() => openCheckIn(res.id)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState text="Sin llegadas programadas para hoy" />
                            )}
                        </Section>

                        {/* Departures */}
                        <Section
                            title="Salidas Hoy"
                            icon={LogOut}
                            count={filteredDepartures.length}
                            pending={filteredDepartures.filter(r => r.status === 'checked_in').length}
                            color="amber"
                        >
                            {filteredDepartures.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {filteredDepartures.map(res => (
                                        <GuestCard
                                            key={res.id}
                                            reservation={res}
                                            variant="departure"
                                            onAction={() => openCheckout(res)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState text="Sin salidas programadas para hoy" />
                            )}
                        </Section>

                        {/* In House */}
                        <Section
                            title="En Estancia"
                            icon={BedDouble}
                            count={filteredInHouse.length}
                            color="blue"
                        >
                            {filteredInHouse.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {filteredInHouse.map(res => (
                                        <GuestCard
                                            key={res.id}
                                            reservation={res}
                                            variant="inhouse"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState text="No hay huéspedes actualmente en el hotel" />
                            )}
                        </Section>
                    </div>
                )}
            </div>

            {/* Check-in wizard */}
            <CheckinWizard
                isOpen={showWizard}
                onClose={handleWizardClose}
                preselectedReservationId={wizardReservationId}
                onCheckinComplete={fetchAll}
            />

            {/* Check-out confirmation modal */}
            <Modal
                isOpen={showCheckout}
                onClose={() => { setShowCheckout(false); setSelectedRes(null); setFolio(null); }}
                title={`Check-out — Hab. ${selectedRes?.room_number}`}
                icon={LogOut}
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => { setShowCheckout(false); setSelectedRes(null); setFolio(null); }}>
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            icon={LogOut}
                            loading={processingCheckout}
                            onClick={handleCheckout}
                        >
                            Confirmar Check-out
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {selectedRes && (
                        <>
                            <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                                <User className="w-4 h-4 text-[var(--color-text-muted)]" />
                                {selectedRes.guest_name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(selectedRes.check_in_date)} → {formatDate(selectedRes.check_out_date)}
                            </div>
                        </>
                    )}
                    {folioLoading ? (
                        <div className="flex items-center justify-center py-4"><LoadingSpinner size="sm" /></div>
                    ) : folio ? (
                        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="text-[var(--color-text-muted)]">Subtotal:</div>
                                <div className="text-right">{formatCurrency(folio.subtotal_base)}</div>
                                <div className="text-[var(--color-text-muted)]">IVA:</div>
                                <div className="text-right">{formatCurrency(folio.tax_iva)}</div>
                                <div className="text-[var(--color-text-muted)]">Total:</div>
                                <div className="text-right font-bold">{formatCurrency(folio.total_amount)}</div>
                                <div className="text-[var(--color-text-muted)]">Pagado:</div>
                                <div className="text-right text-emerald-400">{formatCurrency(folio.total_paid)}</div>
                                <div className="text-[var(--color-text-muted)]">Balance:</div>
                                <div className={`text-right font-bold ${folio.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {formatCurrency(folio.balance)}
                                </div>
                            </div>
                            {folio.balance > 0 && (
                                <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1">
                                    ⚠️ Saldo pendiente de {formatCurrency(folio.balance)}. Registrar pago antes del check-out.
                                </div>
                            )}
                        </div>
                    ) : null}
                    <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] rounded-lg p-2">
                        La habitación pasará a estado <span className="text-red-400 font-medium">Sucia</span> automáticamente.
                    </div>
                </div>
            </Modal>
        </PageWrapper>
    );
}

function Section({ title, icon, count, pending, color, children }) {
    const IconComponent = icon;
    const colorMap = {
        emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400' },
        amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
        blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
    };
    const c = colorMap[color] || colorMap.blue;

    return (
        <section>
            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${c.bg} border ${c.border}`}>
                <IconComponent className={`w-4 h-4 ${c.text}`} />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${c.text}`}>{title}</h3>
                <span className={`text-xs font-bold ${c.text} ml-auto`}>{count}</span>
                {pending !== undefined && (
                    <span className={`text-[10px] ${c.text} opacity-70`}>({pending} pendientes)</span>
                )}
            </div>
            {children}
        </section>
    );
}

function GuestCard({ reservation, variant, onAction }) {
    const configs = {
        arrival: {
            badge: 'info',
            badgeText: 'Reservada',
            btnText: 'Check-in',
            btnVariant: 'primary',
            btnIcon: LogIn,
            border: 'hover:border-emerald-500/30',
        },
        departure: {
            badge: 'warning',
            badgeText: 'Ocupada',
            btnText: 'Check-out',
            btnVariant: 'danger',
            btnIcon: LogOut,
            border: 'hover:border-amber-500/30',
        },
        inhouse: {
            badge: 'success',
            badgeText: 'En estancia',
            btnText: null,
            btnVariant: null,
            btnIcon: null,
            border: 'hover:border-blue-500/30',
        },
    };
    const cfg = configs[variant];

    return (
        <div className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-3 transition-colors ${cfg.border}`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <BedDouble className="w-4 h-4 text-[var(--color-primary)]" />
                    <span className="text-sm font-bold text-[var(--color-text-primary)]">Hab. {reservation.room_number}</span>
                </div>
                <Badge variant={cfg.badge}>{cfg.badgeText}</Badge>
            </div>

            <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
                    <User className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    {reservation.guest_name}
                </div>
                {reservation.guest_document && (
                    <div className="text-xs text-[var(--color-text-muted)]">
                        Doc: {reservation.guest_document}
                    </div>
                )}
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(reservation.check_in_date)} → {formatDate(reservation.check_out_date)}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                    {reservation.plan_name} · {formatCurrency(reservation.nightly_rate_usd)}/noche
                </div>
            </div>

            {cfg.btnText && (
                <Button
                    variant={cfg.btnVariant}
                    size="sm"
                    icon={cfg.btnIcon}
                    onClick={onAction}
                    className="w-full"
                >
                    {cfg.btnText}
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, sub, color }) {
    const IconComponent = icon;
    const colorMap = {
        emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        blue: { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    };
    const c = colorMap[color] || colorMap.blue;

    return (
        <div className={`rounded-xl border ${c.border} ${c.bg} p-3`}>
            <div className="flex items-center gap-2 mb-1">
                <IconComponent className={`w-4 h-4 ${c.text}`} />
                <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">{label}</span>
            </div>
            <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
            {sub && <div className="text-[10px] text-[var(--color-text-muted)]">{sub}</div>}
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="flex items-center justify-center py-12 text-[var(--color-text-muted)]">
            <p className="text-sm">{text}</p>
        </div>
    );
}
