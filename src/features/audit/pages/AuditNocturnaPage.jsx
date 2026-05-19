import { useState, useEffect, useCallback } from 'react';
import {
    Moon, Play, RefreshCw, Users, BedDouble, DollarSign,
    Clock, Sun, Sunset, AlertTriangle, CheckCircle, Building2,
} from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import Button from '@shared/common/Button';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import { apiFetch } from '@utils/api';
import { formatCurrency } from '@utils/formatters';

export default function AuditNocturnaPage() {
    const [status, setStatus] = useState(null);
    const [occupancy, setOccupancy] = useState(null);
    const [cash, setCash] = useState(null);
    const [loading, setLoading] = useState({ status: false, occupancy: false, cash: false, run: false });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fetchAll = useCallback(async () => {
        setLoading(l => ({ ...l, status: true, occupancy: true, cash: true }));
        setError(null);
        try {
            const [s, o, c] = await Promise.all([
                apiFetch('/api/reception/audit/status'),
                apiFetch('/api/reception/audit/occupancy'),
                apiFetch('/api/reception/audit/cash'),
            ]);
            setStatus(s);
            setOccupancy(o);
            setCash(c);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(l => ({ ...l, status: false, occupancy: false, cash: false }));
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const runAudit = async () => {
        setLoading(l => ({ ...l, run: true }));
        setError(null);
        setSuccess(null);
        try {
            const data = await apiFetch('/api/reception/audit/run', { method: 'POST' });
            setSuccess(`Auditoría ejecutada: ${data.rooms_processed} habitaciones procesadas, ${formatCurrency(data.total_rent_charges)} en rentas`);
            fetchAll();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(l => ({ ...l, run: false }));
        }
    };

    const isTodayAudited = status?.last_audit?.audit_date === new Date().toISOString().split('T')[0];

    return (
        <PageWrapper title="Auditoría Nocturna" subtitle="Cierre de día y consolidación" icon={Moon}>
            <div className="space-y-6">
                {/* Header action */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        {isTodayAudited ? (
                            <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Auditoría de hoy completada</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-amber-400">
                                <AlertTriangle className="w-5 h-5" />
                                <span className="text-sm font-medium">Auditoría pendiente para hoy</span>
                            </div>
                        )}
                        {status?.last_audit && (
                            <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                Última ejecución: {status.last_audit.executed_at ? new Date(status.last_audit.executed_at).toLocaleString('es-VE') : '—'}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchAll} loading={loading.status} />
                        <Button
                            variant={isTodayAudited ? 'secondary' : 'primary'}
                            size="sm"
                            icon={Play}
                            loading={loading.run}
                            onClick={runAudit}
                            disabled={isTodayAudited}
                        >
                            {isTodayAudited ? 'Ya ejecutada' : 'Ejecutar Auditoría'}
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {success}
                    </div>
                )}

                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Occupancy */}
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)]">
                            <Users className="w-4 h-4" />
                            Ocupación
                        </div>
                        {loading.occupancy ? (
                            <LoadingSpinner size="sm" />
                        ) : occupancy ? (
                            <div className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-[var(--color-text-primary)]">{occupancy.total_guests}</span>
                                    <span className="text-xs text-[var(--color-text-muted)]">huéspedes</span>
                                </div>
                                <div className="text-xs text-[var(--color-text-muted)]">
                                    {occupancy.total_occupied} / {occupancy.total_rooms} habitaciones
                                </div>
                                <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2">
                                    <div
                                        className="bg-[var(--color-primary)] h-2 rounded-full transition-all"
                                        style={{ width: `${occupancy.total_rooms ? (occupancy.total_occupied / occupancy.total_rooms * 100) : 0}%` }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-[var(--color-text-muted)]">Sin datos</p>
                        )}
                    </div>

                    {/* Rent charges */}
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)]">
                            <DollarSign className="w-4 h-4" />
                            Rentas Procesadas
                        </div>
                        {status?.last_audit ? (
                            <div className="space-y-1">
                                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                                    {formatCurrency(status.last_audit.total_rent_charges)}
                                </div>
                                <div className="text-xs text-[var(--color-text-muted)]">
                                    {status.last_audit.total_occupancy} habitaciones ocupadas
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-[var(--color-text-muted)]">Sin auditorías previas</p>
                        )}
                    </div>

                    {/* Cash */}
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-secondary)]">
                            <DollarSign className="w-4 h-4" />
                            Consolidación de Caja
                        </div>
                        {loading.cash ? (
                            <LoadingSpinner size="sm" />
                        ) : cash ? (
                            <div className="space-y-2">
                                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                                    {formatCurrency(cash.total)}
                                </div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-[var(--color-text-muted)] flex items-center gap-1"><Sun className="w-3 h-3 text-amber-400" /> Mañana</span>
                                        <span>{formatCurrency(cash.shifts.morning.amount)} ({cash.shifts.morning.count})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--color-text-muted)] flex items-center gap-1"><Sunset className="w-3 h-3 text-orange-400" /> Tarde</span>
                                        <span>{formatCurrency(cash.shifts.afternoon.amount)} ({cash.shifts.afternoon.count})</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--color-text-muted)] flex items-center gap-1"><Moon className="w-3 h-3 text-blue-400" /> Noche</span>
                                        <span>{formatCurrency(cash.shifts.night.amount)} ({cash.shifts.night.count})</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-[var(--color-text-muted)]">Sin datos</p>
                        )}
                    </div>
                </div>

                {/* Module breakdown */}
                {occupancy?.modules && occupancy.modules.length > 0 && (
                    <section>
                        <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Ocupación por Módulo
                        </h3>
                        <div className="space-y-2">
                            {occupancy.modules.map(mod => (
                                <div key={mod.module_id} className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
                                    <div className="w-24 text-sm font-medium text-[var(--color-text-primary)]">{mod.module_name}</div>
                                    <div className="flex-1">
                                        <div className="w-full bg-[var(--color-bg-tertiary)] rounded-full h-2">
                                            <div
                                                className="bg-[var(--color-primary)] h-2 rounded-full transition-all"
                                                style={{ width: `${mod.occupancy_pct}%` }}
                                            />
                                        </div>
                                    </div>
                                    <div className="text-xs text-[var(--color-text-muted)] w-24 text-right">
                                        {mod.occupied_rooms}/{mod.total_rooms} ({mod.occupancy_pct}%)
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </PageWrapper>
    );
}