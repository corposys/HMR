import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, AlertTriangle, Battery, Shield, Activity,
    DoorOpen, Loader2, AlertCircle, ChevronRight
} from 'lucide-react';
import { formatDate } from '@utils/formatters';
import { HealthBar } from '@features/maintenance/components/LockSharedComponents';
import { useLockDashboard } from '@features/maintenance/hooks/useLocks';

export default function LockHealthDashboard() {
    const navigate = useNavigate();
    const { alerts, stats, predictions, loading, fetchDashboardData } = useLockDashboard();

    useEffect(() => { 
        fetchDashboardData(); 
    }, [fetchDashboardData]);

    // Group predictions by health range
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
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <button
                            onClick={() => navigate('/maintenance/rooms')}
                            aria-label="Volver al historial"
                            title="Volver al historial"
                            className="p-2.5 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10">
                            <Activity className="w-6 h-6 text-[var(--color-primary)]" />
                        </div>
                        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                            Dashboard Predictivo
                        </h1>
                    </div>
                </div>

                {/* Overview cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                        <p className="text-xs text-red-400 mb-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Críticas</p>
                        <p className="text-2xl font-bold text-red-500">{critical}</p>
                    </div>
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                        <p className="text-xs text-yellow-500 mb-0.5 flex items-center gap-1"><Shield className="w-3 h-3" /> Precaución</p>
                        <p className="text-2xl font-bold text-yellow-500">{warning}</p>
                    </div>
                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                        <p className="text-xs text-green-500 mb-0.5 flex items-center gap-1"><Battery className="w-3 h-3" /> Saludables</p>
                        <p className="text-2xl font-bold text-green-500">{healthy}</p>
                    </div>
                    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
                        <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Alertas activas</p>
                        <p className="text-2xl font-bold text-[var(--color-primary)]">{alerts.length}</p>
                    </div>
                </div>

                {/* Alerts table */}
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden mb-8">
                    <div className="p-4 border-b border-[var(--color-border)]">
                        <h3 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Prioridad de Cambio de Batería
                        </h3>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Habitaciones con batería a ≤15 días del cambio estimado</p>
                    </div>
                    {alerts.length === 0 ? (
                        <div className="p-8 text-center text-sm text-[var(--color-text-muted)]">
                            🎉 No hay alertas activas — todas las baterías están en buen estado
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--color-border)]">
                            {alerts.map(a => (
                                <div key={a.room_id} className="px-4 py-3 flex items-center gap-4 hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer"
                                    onClick={() => navigate(`/maintenance/room/${a.room_id}`)}>
                                    <div className={`p-2 rounded-lg shrink-0 ${a.days_remaining <= 0 ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                                        <DoorOpen className={`w-4 h-4 ${a.days_remaining <= 0 ? 'text-red-500' : 'text-yellow-500'}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-[var(--color-text-primary)]">Hab. {a.room_number}</span>
                                            <span className="text-xs text-[var(--color-text-muted)]">{a.module_name} · {a.floor_code}</span>
                                        </div>
                                        <div className="mt-1.5 w-32">
                                            <HealthBar score={a.health_score} />
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-sm font-bold ${a.days_remaining <= 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                                            {a.days_remaining <= 0 ? `${Math.abs(a.days_remaining)}d vencida` : `${a.days_remaining}d restantes`}
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            Estimado: {formatDate(a.estimated_next_change)}
                                        </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* All predictions (compact) */}
                {predictions.length > 0 && (
                    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-[var(--color-border)]">
                            <h3 className="font-semibold text-[var(--color-text-primary)]">Predicciones por Habitación</h3>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{predictions.length} habitaciones con historial de batería</p>
                        </div>
                        <div className="max-h-96 overflow-y-auto divide-y divide-[var(--color-border)]">
                            {predictions.sort((a, b) => a.health_score - b.health_score).map(p => (
                                <div key={p.room_id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-[var(--color-bg-tertiary)] cursor-pointer"
                                    onClick={() => navigate(`/maintenance/room/${p.room_id}`)}>
                                    <span className="text-xs font-mono font-medium text-[var(--color-text-primary)] w-12">{p.room_number}</span>
                                    <div className="flex-1">
                                        <HealthBar score={p.health_score} />
                                    </div>
                                    <span className="text-xs text-[var(--color-text-muted)] w-28 text-right">
                                        Próx: {formatDate(p.estimated_next_change)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
