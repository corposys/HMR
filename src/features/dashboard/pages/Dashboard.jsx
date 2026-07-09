import { useEffect, useState, useCallback, useRef } from 'react';
import {
    CalendarCheck, Users, BedDouble, Banknote, Lock, Printer,
    PenLine, Ticket, RefreshCcw, AlertTriangle, Wrench, Activity
} from 'lucide-react';
import StatCard from '@shared/common/StatCard';
import Card, { CardHeader, CardTitle, CardContent } from '@shared/common/Card';
import Button from '@shared/common/Button';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import ErrorState from '@shared/common/ErrorState';
import { apiJson } from '@utils/api';
import { usePermissions } from '@hooks/usePermissions';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const REFRESH_INTERVAL = 60_000;

const PIE_COLORS = {
    operational: '#10b981',
    needs_review: '#f59e0b',
    out_of_service: '#ef4444',
    open: '#ef4444',
    in_progress: '#f59e0b',
    resolved: '#10b981',
    closed: '#6b7280',
};

const STATUS_LABELS = {
    operational: 'Operativas',
    needs_review: 'Revisión',
    out_of_service: 'Fuera de servicio',
    open: 'Abiertos',
    in_progress: 'En progreso',
    resolved: 'Resueltos',
    closed: 'Cerrados',
};

async function safeFetch(url) {
    try {
        const data = await apiJson(url);
        return { ok: true, data };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

function unwrap(payload) {
    if (payload && typeof payload === 'object' && 'data' in payload && payload.data && typeof payload.data === 'object') {
        return payload.data;
    }
    return payload;
}

export default function Dashboard() {
    const { can } = usePermissions();
    const [reception, setReception] = useState(null);
    const [overview, setOverview] = useState(null);
    const [tickets30, setTickets30] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const intervalRef = useRef(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const results = await Promise.allSettled([
            safeFetch('/api/reception/dashboard'),
            can('reports', 'read')
                ? safeFetch('/api/reports/overview')
                : Promise.resolve({ ok: false, error: 'no permission' }),
            can('reports', 'read')
                ? safeFetch('/api/reports/tickets?from=' + thirtyDaysAgo() + '&to=' + today())
                : Promise.resolve({ ok: false, error: 'no permission' }),
        ]);

        const [r, o, t] = results;

        if (r.status === 'fulfilled' && r.value.ok) setReception(r.value.data?.dashboard ?? null);
        if (o.status === 'fulfilled' && o.value.ok) setOverview(unwrap(o.value.data));
        if (t.status === 'fulfilled' && t.value.ok) setTickets30(unwrap(t.value.data));

        const hasAny = [r, o, t].some(s => s.status === 'fulfilled' && s.value.ok);
        setError(hasAny ? null : 'No se pudieron cargar los datos del dashboard.');
        setLastUpdate(new Date());
        setLoading(false);
    }, [can]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            fetchAll();
        }, REFRESH_INTERVAL);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [fetchAll]);

    const receptionStats = reception
        ? [
            {
                title: 'Habitaciones ocupadas',
                value: `${reception.occupied}/${reception.total_rooms}`,
                subtitle: `${reception.available} disponibles · ${reception.blocked} bloqueadas`,
                icon: BedDouble,
                variant: 'default',
            },
            {
                title: 'Ingresos del mes',
                value: formatCurrency(reception.month_revenue),
                subtitle: `BCV: Bs. ${reception.bcv_rate?.toFixed(2) || '—'}`,
                icon: Banknote,
                variant: 'success',
            },
            {
                title: 'Llegadas hoy',
                value: reception.arrivals_today,
                subtitle: 'Check-ins programados',
                icon: CalendarCheck,
                variant: 'primary',
            },
            {
                title: 'Huéspedes en casa',
                value: reception.in_house,
                subtitle: `${reception.departures_today} salidas hoy`,
                icon: Users,
                variant: 'default',
            },
        ]
        : [];

    const systemsStats = overview && overview.locks && overview.printers && overview.tickets && overview.toners && overview.signatures
        ? [
            {
                title: 'Cerraduras operativas',
                value: `${overview.locks.operational}/${overview.locks.total}`,
                subtitle: `${overview.locks.needs_review} revisión · ${overview.locks.out_of_service} fuera`,
                icon: Lock,
                variant: overview.locks.operational / Math.max(overview.locks.total, 1) >= 0.85 ? 'success' : 'warning',
            },
            {
                title: 'Tickets activos',
                value: overview.tickets.backlog,
                subtitle: `${overview.tickets.open} nuevos · ${overview.tickets.in_progress} en curso`,
                icon: Ticket,
                variant: overview.tickets.backlog > 5 ? 'danger' : 'default',
            },
            {
                title: 'Impresoras operativas',
                value: `${overview.printers.operational}/${overview.printers.total}`,
                subtitle: `${overview.printers.maintenance} mantto · ${overview.printers.out_of_service} fuera`,
                icon: Printer,
                variant: overview.printers.operational / Math.max(overview.printers.total, 1) >= 0.85 ? 'success' : 'warning',
            },
            {
                title: 'Stock tóners',
                value: overview.toners.total_stock,
                subtitle: `${overview.toners.low_stock_items} con stock bajo`,
                icon: Wrench,
                variant: overview.toners.low_stock_items > 0 ? 'warning' : 'default',
            },
            {
                title: 'Firmas activas',
                value: overview.signatures.total,
                subtitle: 'Generadas en el sistema',
                icon: PenLine,
                variant: 'primary',
            },
        ]
        : [];

    const ticketsChartData = overview && overview.tickets
        ? ['open', 'in_progress', 'resolved', 'closed'].map((s) => ({
            name: STATUS_LABELS[s],
            value: overview.tickets[s] || 0,
            key: s,
        }))
        : [];

    const ticketsByDayData = tickets30?.created_vs_resolved_by_day || [];

    return (
        <div className="py-5 w-full px-5">
            <div className="mx-auto max-w-auto space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                            <Activity className="w-6 h-6 text-[var(--color-primary)]" />
                            Dashboard General
                        </h1>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                            Última actualización: {lastUpdate.toLocaleTimeString('es')}
                            {' · '}
                            <span className="text-[var(--color-text-muted)]">auto-refresh 60s</span>
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        icon={RefreshCcw}
                        onClick={fetchAll}
                        size="sm"
                        disabled={loading}
                    >
                        Actualizar
                    </Button>
                </div>

                {loading && !reception && !overview ? (
                    <LoadingSpinner size="lg" />
                ) : error && !reception && !overview ? (
                    <ErrorState message={error} onRetry={fetchAll} />
                ) : (
                    <>
                        {reception && (
                            <section>
                                <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                                    Operación Hotelera
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {receptionStats.map((s, i) => <StatCard key={i} {...s} />)}
                                </div>
                            </section>
                        )}

                        {systemsStats.length > 0 && (
                            <section className="mt-6">
                                <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                                    Sistemas Integrados
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {systemsStats.map((s, i) => <StatCard key={i} {...s} />)}
                                </div>
                            </section>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            {tickets30 && tickets30.created_vs_resolved_by_day.length > 0 && (
                                <Card padding="md">
                                    <CardHeader>
                                        <CardTitle>Tickets: creados vs resueltos</CardTitle>
                                        <p className="text-sm text-[var(--color-text-muted)] mt-1">Últimos 30 días</p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={ticketsByDayData}>
                                                    <defs>
                                                        <linearGradient id="dashColorCreated" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                        <linearGradient id="dashColorResolved" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                                    <XAxis dataKey="day" stroke="var(--color-text-muted)" fontSize={10} />
                                                    <YAxis stroke="var(--color-text-muted)" fontSize={11} allowDecimals={false} />
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'var(--color-bg-elevated)',
                                                            border: '1px solid var(--color-border)',
                                                            borderRadius: '8px',
                                                            color: 'var(--color-text-primary)',
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="created"
                                                        stroke="#3b82f6"
                                                        fill="url(#dashColorCreated)"
                                                        name="Creados"
                                                    />
                                                    <Area
                                                        type="monotone"
                                                        dataKey="resolved"
                                                        stroke="#10b981"
                                                        fill="url(#dashColorResolved)"
                                                        name="Resueltos"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {ticketsChartData.length > 0 && (
                                <Card padding="md">
                                    <CardHeader>
                                        <CardTitle>Distribución de tickets</CardTitle>
                                        <p className="text-sm text-[var(--color-text-muted)] mt-1">Por estado actual</p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={ticketsChartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={50}
                                                        outerRadius={90}
                                                        dataKey="value"
                                                        label={({ name, value }) => `${name}: ${value}`}
                                                        labelLine={false}
                                                    >
                                                        {ticketsChartData.map((entry) => (
                                                            <Cell key={entry.key} fill={PIE_COLORS[entry.key]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'var(--color-bg-elevated)',
                                                            border: '1px solid var(--color-border)',
                                                            borderRadius: '8px',
                                                            color: 'var(--color-text-primary)',
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {overview && overview.locks && (
                            <Card padding="md" className="mt-6">
                                <CardHeader>
                                    <CardTitle>Estado de cerraduras</CardTitle>
                                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                        Distribución actual: {overview.locks.total} cerraduras en el hotel
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={[
                                                    { name: 'Operativas', value: overview.locks.operational, fill: PIE_COLORS.operational },
                                                    { name: 'Revisión', value: overview.locks.needs_review, fill: PIE_COLORS.needs_review },
                                                    { name: 'Fuera de servicio', value: overview.locks.out_of_service, fill: PIE_COLORS.out_of_service },
                                                ]}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} />
                                                <YAxis stroke="var(--color-text-muted)" fontSize={12} allowDecimals={false} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--color-bg-elevated)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '8px',
                                                        color: 'var(--color-text-primary)',
                                                    }}
                                                />
                                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                    {[
                                                        { fill: PIE_COLORS.operational },
                                                        { fill: PIE_COLORS.needs_review },
                                                        { fill: PIE_COLORS.out_of_service },
                                                    ].map((entry, i) => (
                                                        <Cell key={i} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function formatCurrency(value) {
    const n = Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(n);
}

function today() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

function thirtyDaysAgo() {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
}
