import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Filter, History, Trash2, Edit2, AlertCircle, Loader2,
    Calendar, User, ArrowLeft,
    AlertTriangle, Battery, Shield, Activity, DoorOpen, ChevronRight, Wrench, Cog, X
} from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { formatDate } from '@utils/formatters';
import { useMaintenanceLogs, useMaintenanceDashboard } from '@features/maintenance/hooks/useMaintenance';
import CreateMaintenanceModal from '@features/maintenance/components/CreateMaintenanceModal';
import DeleteMaintenanceModal from '@features/maintenance/components/DeleteMaintenanceModal';
import Button from '@shared/common/Button';
import { LogRow, HealthBar } from '@features/maintenance/components/MaintenanceComponents';

// ── Main page ────────────────────────────────────────────────────────────────

export default function MaintenanceHistory() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const {
        logs, stats, loading: logsLoading, error, saving, deleting,
        fetchLogs, deleteLog, createLog
    } = useMaintenanceLogs();

    const {
        alerts,
        stats: dashboardStats,
        predictions,
        loading: dashboardLoading,
        fetchDashboardData
    } = useMaintenanceDashboard();

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [toDelete, setToDelete] = useState(null);
    const [showCreate, setShowCreate] = useState(false);

    useEffect(() => {
        fetchLogs(typeFilter);
        fetchDashboardData();
    }, [fetchLogs, fetchDashboardData, typeFilter]);

    const loading = logsLoading || dashboardLoading;

    const handleDelete = async () => {
        if (!toDelete) return;
        const success = await deleteLog(toDelete.id);
        if (success) setToDelete(null);
    };

    const handleCreate = async (data) => {
        const success = await createLog(data);
        if (success) {
            setShowCreate(false);
            fetchLogs(typeFilter);
        }
    };

    // Filter by search
    const filtered = logs.filter(l => {
        const q = search.toLowerCase();
        return l.room_number.toLowerCase().includes(q) ||
            (l.module_name || '').toLowerCase().includes(q) ||
            (l.part_name || '').toLowerCase().includes(q) ||
            (l.description || '').toLowerCase().includes(q);
    });

    // Dashboard Metrics
    const critical = predictions.filter(p => p.health_score < 30).length;
    const warning = predictions.filter(p => p.health_score >= 30 && p.health_score < 60).length;
    const healthy = predictions.filter(p => p.health_score >= 60).length;

    if (loading) {
        return (
            <div className="py-6 px-4 lg:px-8 w-full flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="py-6 px-4 lg:px-8 w-full">
            <div className="mx-auto max-w-auto">
                {/* Header */}
                {/* Header and Actions Line */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
                    {/* Left: Title & Subtitle */}
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10">
                                <Wrench className="w-6 h-6 text-[var(--color-primary)]" />
                            </div>
                            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                                Control de Cerraduras
                            </h1>
                        </div>
                    </div>

                    {/* Right: Search, Filters & Action */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Search */}
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                            <input
                                type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar habitación..."
                                className="w-full pl-9 pr-8 py-2 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="flex gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto">
                            {[
                                { value: 'all', label: 'Todos' },
                                { value: 'battery', label: 'Batería', icon: Battery },
                                { value: 'mechanical', label: 'Mecánico', icon: Cog },
                            ].map(f => {
                                const Icon = f.icon;
                                return (
                                    <button key={f.value}
                                        onClick={() => setTypeFilter(f.value)}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap ${typeFilter === f.value
                                            ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 text-[var(--color-primary)]'
                                            : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                                            }`}
                                    >
                                        {Icon && <Icon className="w-3.5 h-3.5" />}
                                        {f.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Action Button */}
                        <Button
                            onClick={() => setShowCreate(true)}
                            variant="register"
                            icon={Plus}
                            className="shrink-0 w-full sm:w-auto"
                        >
                            Registrar
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
                            <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Total registros</p>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.total}</p>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
                            <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Este mes</p>
                            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.this_month}</p>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
                            <p className="text-xs text-[var(--color-text-muted)] mb-0.5 flex items-center gap-1"><Battery className="w-3 h-3" /> Baterías</p>
                            <p className="text-2xl font-bold text-green-500">{stats.battery_changes}</p>
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 shadow-sm">
                            <p className="text-xs text-[var(--color-text-muted)] mb-0.5 flex items-center gap-1"><Cog className="w-3 h-3" /> Mecánicos</p>
                            <p className="text-2xl font-bold text-orange-500">{stats.mechanical_repairs}</p>
                        </div>
                    </div>
                )}

                {/* Content */}
                {error ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                        <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
                        <button onClick={() => fetchLogs(typeFilter)} className="text-sm text-[var(--color-primary)] hover:underline">Reintentar</button>
                    </div>
                ) : logs.length === 0 && !search && alerts.length === 0 && stats?.total === 0 ? ( // Only show empty state if absolutely no data exists
                    <div className="flex flex-col items-center justify-center py-24 gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center shadow-inner">
                            <Wrench className="w-10 h-10 text-[var(--color-text-muted)]" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Sin registros de mantenimiento</h3>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* DASHBOARD PREDICTIVO (COMPACT) */}
                        <div className="mb-8">
                            {/* Unified Stats Box */}
                            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 shadow-sm">
                                <div>
                                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-[var(--color-primary)]" />
                                        Predicciones de Batería
                                    </h3>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                        {predictions.length} cerraduras monitoreadas ({alerts.length} alertas)
                                    </p>
                                </div>

                                <div className="flex items-center gap-5 sm:gap-8">
                                    <div className="flex flex-col items-center sm:items-end">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 mb-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Críticas</span>
                                        <span className="text-xl font-bold text-red-500 leading-none">{critical}</span>
                                    </div>
                                    <div className="w-px h-8 bg-[var(--color-border)]"></div>
                                    <div className="flex flex-col items-center sm:items-end">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-yellow-500 mb-0.5 flex items-center gap-1"><Shield className="w-3 h-3" /> Precaución</span>
                                        <span className="text-xl font-bold text-yellow-500 leading-none">{warning}</span>
                                    </div>
                                    <div className="w-px h-8 bg-[var(--color-border)]"></div>
                                    <div className="flex flex-col items-center sm:items-end">
                                        <span className="text-[10px] uppercase font-bold tracking-wider text-green-500 mb-0.5 flex items-center gap-1"><Battery className="w-3 h-3" /> Saludables</span>
                                        <span className="text-xl font-bold text-green-500 leading-none">{healthy}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Compact Alerts List */}
                            {alerts.length > 0 && (
                                <div className="mt-3">
                                    <h4 className="text-[11px] font-semibold text-red-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ml-1">
                                        <AlertCircle className="w-3.5 h-3.5" /> Requieren Atención (≤15 días)
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {alerts.map(a => (
                                            <div key={a.room_id}
                                                onClick={() => navigate(`/maintenance/room/${a.room_id}`)}
                                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer hover:shadow-sm transition-all ${a.days_remaining <= 0
                                                    ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                                                    : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-500'
                                                    }`}>
                                                <DoorOpen className="w-3.5 h-3.5 opacity-70" />
                                                <span className="font-bold">Hab. {a.room_number}</span>
                                                <span className="opacity-30">|</span>
                                                <span className="font-medium whitespace-nowrap text-[11px]">
                                                    {a.days_remaining <= 0 ? `${Math.abs(a.days_remaining)}d vencida` : `${a.days_remaining}d restantes`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* HISTORIAL (STACK BOTTOM) */}
                        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden flex flex-col flex-1 h-[600px]">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                                        <th className="py-2 pl-3 pr-2 w-8"></th>
                                        <th className="py-2 px-2 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Habitación</th>
                                        <th className="py-2 px-2 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Ubicación</th>
                                        <th className="py-2 px-2 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Descripción</th>
                                        <th className="py-2 px-2 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Fecha</th>
                                        <th className="py-2 px-2 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Técnico</th>
                                        <th className="py-2 pl-2 pr-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(log => (
                                        <LogRow
                                            key={log.id}
                                            log={log}
                                            onDelete={setToDelete}
                                            onViewRoom={(roomId) => navigate(`/maintenance/room/${roomId}`)}
                                            formatDate={formatDate}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {toDelete && <DeleteMaintenanceModal log={toDelete} onConfirm={handleDelete} onCancel={() => setToDelete(null)} loading={deleting} />}
            {showCreate && <CreateMaintenanceModal onSave={handleCreate} onCancel={() => setShowCreate(false)} saving={saving} />}
        </div>
    );
}
