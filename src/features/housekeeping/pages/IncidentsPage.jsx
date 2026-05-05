import { useState, useCallback, useEffect, useMemo } from 'react';
import { AlertTriangle, Filter, Calendar, BedDouble, CheckCircle, XCircle } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import { apiFetch } from '@utils/api';
import IncidentBadge from '../components/IncidentBadge';
import IncidentFormModal from '../components/IncidentFormModal';

const TYPE_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'broken_item', label: 'Artículo roto' },
    { value: 'missing_inventory', label: 'Falta inventario' },
    { value: 'maintenance_needed', label: 'Mantenimiento' },
    { value: 'guest_belongings', label: 'Objetos huésped' },
    { value: 'damage', label: 'Daño' },
    { value: 'other', label: 'Otro' },
];

const SEVERITY_OPTIONS = [
    { value: '', label: 'Todas' },
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' },
    { value: 'critical', label: 'Crítica' },
];

export default function IncidentsPage() {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [typeFilter, setTypeFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [resolvedFilter, setResolvedFilter] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);

    const fetchIncidents = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (typeFilter) params.set('type_filter', typeFilter);
            if (severityFilter) params.set('severity_filter', severityFilter);
            if (resolvedFilter !== null) params.set('resolved_filter', resolvedFilter);

            const data = await apiFetch(`/api/housekeeping/incidents?${params.toString()}`);
            setIncidents(data.incidents || []);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [typeFilter, severityFilter, resolvedFilter]);

    useEffect(() => {
        fetchIncidents();
    }, [fetchIncidents]);

    const handleResolve = async (incidentId) => {
        await apiFetch(`/api/housekeeping/incidents/${incidentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolved: true }),
        });
        await fetchIncidents();
    };

    const handleUnresolve = async (incidentId) => {
        await apiFetch(`/api/housekeeping/incidents/${incidentId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolved: false }),
        });
        await fetchIncidents();
    };

    const handleReportSubmit = async (data) => {
        await apiFetch('/api/housekeeping/incidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        await fetchIncidents();
    };

    const stats = useMemo(() => ({
        total: incidents.length,
        open: incidents.filter(i => !i.resolved).length,
        resolved: incidents.filter(i => i.resolved).length,
        critical: incidents.filter(i => i.severity === 'critical' && !i.resolved).length,
    }), [incidents]);

    const filters = [
        { key: 'all', label: 'Todas', count: stats.total, icon: Filter },
        { key: 'open', label: 'Abiertas', count: stats.open, icon: AlertTriangle },
        { key: 'resolved', label: 'Resueltas', count: stats.resolved, icon: CheckCircle },
        { key: 'critical', label: 'Críticas', count: stats.critical, icon: XCircle },
    ];

    const [activeFilter, setActiveFilter] = useState('all');

    const filteredIncidents = useMemo(() => {
        if (activeFilter === 'all') return incidents;
        if (activeFilter === 'open') return incidents.filter(i => !i.resolved);
        if (activeFilter === 'resolved') return incidents.filter(i => i.resolved);
        if (activeFilter === 'critical') return incidents.filter(i => i.severity === 'critical' && !i.resolved);
        return incidents;
    }, [incidents, activeFilter]);

    return (
        <PageWrapper title="Incidencias" subtitle="Reportes y seguimiento de incidencias" icon={AlertTriangle}>
            <div className="space-y-4">
                {/* Stats Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {filters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setActiveFilter(f.key)}
                            className={`
                                flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium shrink-0 transition-all duration-150
                                ${activeFilter === f.key
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                    : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)]'
                                }
                            `}
                        >
                            <f.icon className="w-3 h-3" />
                            {f.label}
                            <span className="text-[10px] opacity-70">{f.count}</span>
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value)}
                        className="input text-sm rounded-lg"
                    >
                        {TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <select
                        value={severityFilter}
                        onChange={e => setSeverityFilter(e.target.value)}
                        className="input text-sm rounded-lg"
                    >
                        {SEVERITY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => { setTypeFilter(''); setSeverityFilter(''); setResolvedFilter(null); }}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] transition-colors"
                    >
                        Limpiar filtros
                    </button>
                </div>

                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {!loading && filteredIncidents.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
                        <CheckCircle className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-sm">No hay incidencias registradas</p>
                    </div>
                )}

                {/* Incidents Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] animate-pulse p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--color-border)]" />
                                    <div className="w-12 h-4 rounded bg-[var(--color-border)]" />
                                </div>
                                <div className="w-full h-2 rounded bg-[var(--color-border)] mb-2" />
                                <div className="w-2/3 h-2 rounded bg-[var(--color-border)]" />
                            </div>
                        ))
                        : filteredIncidents.map(incident => (
                            <div
                                key={incident.id}
                                className={`
                                    rounded-xl border transition-all duration-150 overflow-hidden
                                    ${incident.resolved
                                        ? 'border-emerald-500/20 bg-emerald-500/5'
                                        : incident.severity === 'critical'
                                        ? 'border-red-500/30 bg-red-500/5'
                                        : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]'
                                    }
                                `}
                            >
                                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]/50">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)]">
                                            <BedDouble className="w-4 h-4 text-[var(--color-text-muted)]" />
                                        </div>
                                        <span className="text-base font-bold">{incident.room_number}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                                        <Calendar className="w-2.5 h-2.5" />
                                        {new Date(incident.created_at).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })}
                                    </div>
                                </div>

                                <div className="px-3 py-2">
                                    <IncidentBadge incident={incident} />
                                    {incident.description && (
                                        <p className="text-xs text-[var(--color-text-secondary)] mt-2 line-clamp-2">
                                            {incident.description}
                                        </p>
                                    )}
                                    {incident.staff_name && (
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: incident.staff_color }} />
                                            <span className="text-[10px] text-[var(--color-text-muted)]">{incident.staff_name}</span>
                                        </div>
                                    )}
                                    {incident.maintenance_ticket_id && (
                                        <div className="mt-2 text-[10px] text-orange-400 font-medium">
                                            Ticket MTTO #{incident.maintenance_ticket_id}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between px-3 pb-2">
                                    {incident.resolved ? (
                                        <button
                                            onClick={() => handleUnresolve(incident.id)}
                                            className="text-[10px] text-emerald-400 font-medium hover:underline"
                                        >
                                            Reabrir
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleResolve(incident.id)}
                                            className="flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all duration-150"
                                        >
                                            <CheckCircle className="w-2.5 h-2.5" />
                                            Marcar resuelta
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>

            <IncidentFormModal
                room={null}
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                onSubmit={handleReportSubmit}
            />
        </PageWrapper>
    );
}
