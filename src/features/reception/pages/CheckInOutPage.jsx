import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Search, RefreshCw, AlertTriangle, LogIn, LogOut,
    BedDouble, Percent, Home, DollarSign, User, Calendar,
} from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import Button from '@shared/common/Button';
import Modal from '@shared/common/Modal';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import EmptyState from '@shared/common/EmptyState';
import { Card, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { apiFetch } from '@utils/api';
import { formatDate, formatCurrency } from '@utils/formatters';
import CheckInOutTable from '@features/reception/components/CheckInOutTable';
import CheckinWizard from '@features/reservations/components/CheckinWizard';

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

const STATS_CONFIG = [
    { key: 'occupancy', icon: Percent, label: 'Ocupación', color: 'cyan' },
    { key: 'arrivals', icon: LogIn, label: 'Llegadas', color: 'emerald' },
    { key: 'departures', icon: LogOut, label: 'Salidas', color: 'amber' },
    { key: 'inHouse', icon: Home, label: 'En Casa', color: 'blue' },
    { key: 'available', icon: BedDouble, label: 'Disponibles', color: 'purple' },
    { key: 'revenue', icon: DollarSign, label: 'Ingresos Mes', color: 'emerald' },
];

const STAT_COLORS = {
    cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm',
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-sm',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-sm',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300 shadow-sm',
    purple: 'border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-sm',
};

export default function CheckInOutPage() {
    const [arrivals, setArrivals] = useState([]);
    const [inHouse, setInHouse] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('arrivals');

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
            const [dashboardData, arrData, houseData] = await Promise.all([
                apiFetch('/api/reception/dashboard'),
                apiFetch(`/api/reception/reservations?status=reserved&date_from=${today}&date_to=${today}&limit=100`),
                apiFetch('/api/reception/reservations?status=checked_in&limit=200'),
            ]);
            setDashboard(dashboardData.dashboard || null);
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

    const stats = useMemo(() => {
        const occ = dashboard?.occupied || 0;
        const total = dashboard?.total_rooms || 96;
        const todayArrivals = dashboard?.arrivals_today ?? arrivals.length;
        const departuresToday = inHouse.filter(r => r.check_out_date === getTodayStr());
        const departuresCount = dashboard?.departures_today ?? departuresToday.length;
        const inHouseCount = dashboard?.in_house ?? inHouse.length;
        const avail = dashboard?.available || 0;
        const blocked = dashboard?.blocked || 0;
        const revenue = dashboard?.month_revenue || 0;
        const bcvRate = dashboard?.bcv_rate || null;

        return {
            occupancy: `${occ}/${total}`,
            occupancySub: `${total > 0 ? Math.round((occ / total) * 100) : 0}%`,
            arrivals: todayArrivals,
            departures: departuresCount,
            inHouse: inHouseCount,
            available: avail,
            availableSub: `${blocked} bloqueadas`,
            revenue: `$${revenue.toLocaleString('es-VE')}`,
            revenueSub: bcvRate ? `Bs. ${Number(bcvRate).toFixed(2)}` : null,
        };
    }, [dashboard, arrivals, inHouse]);

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

    const openCheckIn = (id) => {
        setWizardReservationId(id);
        setShowWizard(true);
    };

    const handleWizardClose = () => {
        setShowWizard(false);
        setWizardReservationId(null);
        fetchAll();
    };

    const openCheckout = async (resId) => {
        const res = [...arrivals, ...inHouse].find(r => r.id === resId || r.room_id === resId);
        if (!res) return;
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
        <PageWrapper>
            <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
                <CardHeader className="py-3 px-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex w-full sm:w-auto items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            {STATS_CONFIG.map((stat) => {
                                const IconCmp = stat.icon;
                                const value = stats[stat.key];
                                const sub = stat.key === 'occupancy' ? stats.occupancySub
                                    : stat.key === 'available' ? stats.availableSub
                                    : stat.key === 'revenue' ? stats.revenueSub
                                    : null;
                                return (
                                    <div
                                        key={stat.key}
                                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 transition-all ${STAT_COLORS[stat.color] || STAT_COLORS.cyan}`}
                                    >
                                        <IconCmp className="h-3 w-3 shrink-0" />
                                        <span className="hidden sm:inline">{stat.label}</span>
                                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold bg-white/10 text-current">
                                            {value}
                                        </span>
                                        {sub && (
                                            <span className="text-[9px] opacity-70 hidden sm:inline">({sub})</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <div className="relative flex-1 sm:flex-none">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="h-8 w-full sm:w-48 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] pl-8 pr-3 text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)]/50"
                                />
                                {search && (
                                    <button
                                        onClick={() => setSearch('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                                    >
                                        <span className="text-xs font-bold">&times;</span>
                                    </button>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={fetchAll}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
                                title="Actualizar"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] h-auto gap-1 p-1 justify-start overflow-x-auto scrollbar-hide w-full">
                        <TabsTrigger
                            value="arrivals"
                            className="flex-1 sm:flex-none data-[state=active]:bg-[var(--color-bg-tertiary)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)] text-xs px-3 py-1.5 rounded-md whitespace-nowrap shrink-0"
                        >
                            Llegadas
                            <span className="ml-1.5 text-[10px] data-[state=active]:text-[var(--color-text-muted)] text-[var(--color-text-muted)]">
                                {filteredArrivals.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="departures"
                            className="flex-1 sm:flex-none data-[state=active]:bg-[var(--color-bg-tertiary)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)] text-xs px-3 py-1.5 rounded-md whitespace-nowrap shrink-0"
                        >
                            Salidas
                            <span className="ml-1.5 text-[10px] data-[state=active]:text-[var(--color-text-muted)] text-[var(--color-text-muted)]">
                                {filteredDepartures.length}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="inhouse"
                            className="flex-1 sm:flex-none data-[state=active]:bg-[var(--color-bg-tertiary)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)] text-xs px-3 py-1.5 rounded-md whitespace-nowrap shrink-0"
                        >
                            En Estancia
                            <span className="ml-1.5 text-[10px] data-[state=active]:text-[var(--color-text-muted)] text-[var(--color-text-muted)]">
                                {filteredInHouse.length}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="arrivals">
                        {filteredArrivals.length > 0 ? (
                            <CheckInOutTable
                                reservations={filteredArrivals}
                                variant="arrival"
                                onAction={(id) => openCheckIn(id)}
                            />
                        ) : (
                            <EmptyState title="Sin llegadas programadas para hoy" />
                        )}
                    </TabsContent>

                    <TabsContent value="departures">
                        {filteredDepartures.length > 0 ? (
                            <CheckInOutTable
                                reservations={filteredDepartures}
                                variant="departure"
                                onAction={openCheckout}
                            />
                        ) : (
                            <EmptyState title="Sin salidas programadas para hoy" />
                        )}
                    </TabsContent>

                    <TabsContent value="inhouse">
                        {filteredInHouse.length > 0 ? (
                            <CheckInOutTable
                                reservations={filteredInHouse}
                                variant="inhouse"
                            />
                        ) : (
                            <EmptyState title="No hay huéspedes actualmente en el hotel" />
                        )}
                    </TabsContent>
                </Tabs>
            )}

            <CheckinWizard
                isOpen={showWizard}
                onClose={handleWizardClose}
                preselectedReservationId={wizardReservationId}
                onCheckinComplete={fetchAll}
            />

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
                                    Saldo pendiente de {formatCurrency(folio.balance)}. Registrar pago antes del check-out.
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
