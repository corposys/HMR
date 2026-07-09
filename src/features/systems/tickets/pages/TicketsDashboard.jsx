import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Ticket, Search, RefreshCw, X, Plus,
    AlertTriangle, Clock, CheckCircle, XCircle,
    MessageSquare, User, MapPin, ArrowUpRight
} from 'lucide-react';
import { apiJson } from '@utils/api';
import PageWrapper from '@shared/common/PageWrapper';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import ErrorState from '@shared/common/ErrorState';
import CustomDropdown from '@shared/common/CustomDropdown';
import Button from '@shared/common/Button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import CreateTicketModal from '@features/systems/tickets/components/CreateTicketModal';

const STATUS_OPTIONS = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'open', label: 'Pendientes' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'resolved', label: 'Resueltos' },
    { value: 'closed', label: 'Cerrados' },
];

const PRIORITY_FILTER_OPTIONS = [
    { value: 'all', label: 'Todas las prioridades' },
    { value: 'urgente', label: 'Urgente' },
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baja', label: 'Baja' },
];

const CATEGORY_OPTIONS = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'software', label: 'Software' },
    { value: 'conectividad', label: 'Conectividad' },
    { value: 'otro', label: 'Otro' },
];

const PRIORITY_COLORS = {
    urgente: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    alta: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    media: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    baja: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
};

const STATUS_COLORS = {
    open: 'bg-red-500/10 text-red-600 dark:text-red-400',
    in_progress: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    resolved: 'bg-green-500/10 text-green-600 dark:text-green-400',
    closed: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
};

const STATUS_LABELS = {
    open: 'Pendiente',
    in_progress: 'En Progreso',
    resolved: 'Resuelto',
    closed: 'Cerrado',
};

const CATEGORY_LABELS = {
    hardware: 'Hardware',
    software: 'Software',
    conectividad: 'Conectividad',
    otro: 'Otro',
};

const PRIORITY_LABELS = {
    urgente: 'Urgente',
    alta: 'Alta',
    media: 'Media',
    baja: 'Baja',
};

export default function TicketsDashboard() {
    const navigate = useNavigate();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreate, setShowCreate] = useState(false);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
            if (priorityFilter && priorityFilter !== 'all') params.set('priority', priorityFilter);
            if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter);
            if (search) params.set('search', search);
            const qs = params.toString();
            const data = await apiJson(`/api/tickets${qs ? `?${qs}` : ''}`);
            setTickets(data.tickets || []);
        } catch (err) {
            setError(err.message || 'Error al cargar tickets');
        } finally {
            setLoading(false);
        }
    }, [search, priorityFilter, categoryFilter, statusFilter]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setStatusFilter(tab === 'all' ? 'all' : tab);
        setSearch('');
    };

    const displayedTickets = useMemo(() => {
        if (!search) return tickets;
        const q = search.toLowerCase();
        return tickets.filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.ticket_number.toLowerCase().includes(q) ||
            t.submitted_by_name.toLowerCase().includes(q) ||
            (t.submitted_by_department && t.submitted_by_department.toLowerCase().includes(q))
        );
    }, [tickets, search]);

    const counts = useMemo(() => {
        const all = tickets.length;
        const open = tickets.filter(t => t.status === 'open').length;
        const inProgress = tickets.filter(t => t.status === 'in_progress').length;
        const resolved = tickets.filter(t => t.status === 'resolved').length;
        const closed = tickets.filter(t => t.status === 'closed').length;
        return { all, open, inProgress, resolved, closed };
    }, [tickets]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading && tickets.length === 0) {
        return (
            <PageWrapper>
                <div className="flex items-center justify-center min-h-[400px]">
                    <LoadingSpinner />
                </div>
            </PageWrapper>
        );
    }

    if (error && tickets.length === 0) {
        return (
            <PageWrapper>
                <ErrorState message={error} onRetry={fetchTickets} />
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] mb-4">
                    <TabsTrigger value="all" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <Ticket className="w-4 h-4" />
                        Todos
                        <span className="ml-1 text-[11px] text-[var(--color-text-muted)]">{counts.all}</span>
                    </TabsTrigger>
                    <TabsTrigger value="open" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Pendientes
                        <span className="ml-1 text-[11px] text-[var(--color-text-muted)]">{counts.open}</span>
                    </TabsTrigger>
                    <TabsTrigger value="in_progress" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        En Progreso
                        <span className="ml-1 text-[11px] text-[var(--color-text-muted)]">{counts.inProgress}</span>
                    </TabsTrigger>
                    <TabsTrigger value="resolved" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Resueltos
                        <span className="ml-1 text-[11px] text-[var(--color-text-muted)]">{counts.resolved}</span>
                    </TabsTrigger>
                    <TabsTrigger value="closed" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Cerrados
                        <span className="ml-1 text-[11px] text-[var(--color-text-muted)]">{counts.closed}</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-0">
                    <Card className="p-6 bg-[var(--color-bg-secondary)] border-[var(--color-border)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="relative flex-1 sm:flex-none w-full sm:w-64 h-8">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Buscar tickets..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-full pl-8 pr-8 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <CustomDropdown
                                    value={priorityFilter}
                                    onChange={setPriorityFilter}
                                    options={PRIORITY_FILTER_OPTIONS}
                                    placeholder="Prioridad"
                                    className="min-w-[140px]"
                                    buttonClassName="h-8 text-xs"
                                />
                                <CustomDropdown
                                    value={categoryFilter}
                                    onChange={setCategoryFilter}
                                    options={CATEGORY_OPTIONS}
                                    placeholder="Categoría"
                                    className="min-w-[130px]"
                                    buttonClassName="h-8 text-xs"
                                />
                                <Button variant="ghost" onClick={fetchTickets} icon={RefreshCw} className="h-8 w-8 !p-0 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/10 shrink-0" />
                                <Button
                                    variant="primary"
                                    onClick={() => setShowCreate(true)}
                                    icon={Plus}
                                    className="h-8 text-xs"
                                >
                                    Nuevo Ticket
                                </Button>
                            </div>
                        </div>

                        {displayedTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[var(--color-border)] rounded-lg">
                                <Ticket className="w-12 h-12 text-[var(--color-text-muted)] mb-3 opacity-50" />
                                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">No hay tickets</h3>
                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">No se encontraron tickets con los filtros actuales.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                                            <th className="py-3 px-4">Ticket</th>
                                            <th className="py-3 px-4">Título</th>
                                            <th className="py-3 px-4">Categoría</th>
                                            <th className="py-3 px-4">Prioridad</th>
                                            <th className="py-3 px-4">Estado</th>
                                            <th className="py-3 px-4">Solicitante</th>
                                            <th className="py-3 px-4">Asignado</th>
                                            <th className="py-3 px-4">Fecha</th>
                                            <th className="py-3 px-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {displayedTickets.map(ticket => (
                                            <tr key={ticket.id} className="hover:bg-[var(--color-bg-primary)]/50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className="font-mono text-xs font-semibold text-[var(--color-primary)]">
                                                        {ticket.ticket_number}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 max-w-[200px]">
                                                    <div className="truncate font-medium text-[var(--color-text-primary)]" title={ticket.title}>
                                                        {ticket.title}
                                                    </div>
                                                    {ticket.comment_count > 0 && (
                                                        <div className="flex items-center gap-1 text-[var(--color-text-muted)] text-[11px] mt-0.5">
                                                            <MessageSquare className="w-3 h-3" />
                                                            {ticket.comment_count}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                                                        {CATEGORY_LABELS[ticket.category] || ticket.category}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[ticket.priority] || ''}`}>
                                                        {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status] || ''}`}>
                                                        {ticket.status === 'open' && <AlertTriangle className="w-3 h-3" />}
                                                        {ticket.status === 'in_progress' && <Clock className="w-3 h-3" />}
                                                        {ticket.status === 'resolved' && <CheckCircle className="w-3 h-3" />}
                                                        {ticket.status === 'closed' && <XCircle className="w-3 h-3" />}
                                                        {STATUS_LABELS[ticket.status] || ticket.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-[var(--color-text-primary)] font-medium text-xs">
                                                        {ticket.submitted_by_name}
                                                    </div>
                                                    {ticket.submitted_by_department && (
                                                        <div className="text-[var(--color-text-muted)] text-[11px] flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {ticket.submitted_by_department}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {ticket.assigned_name ? (
                                                        <span className="text-[var(--color-text-secondary)] text-xs flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            {ticket.assigned_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[var(--color-text-muted)] text-xs">Sin asignar</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)] text-xs">
                                                    {formatDate(ticket.created_at)}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/systems/tickets/${ticket.id}`)}
                                                            className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors font-medium"
                                                        >
                                                            <ArrowUpRight className="w-3 h-3" />
                                                            Ver
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            <CreateTicketModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                onCreated={fetchTickets}
            />
        </PageWrapper>
    );
}
