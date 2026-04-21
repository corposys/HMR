import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Battery, Cog, Calendar, DoorOpen,
    Loader2, AlertCircle, Clock, User, Wrench, Plus
} from 'lucide-react';

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function HealthBar({ score, large }) {
    const color = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500';
    const label = score >= 70 ? 'Saludable' : score >= 40 ? 'Precaución' : 'Crítica';
    const textColor = score >= 70 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500';
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium ${textColor}`}>{label}</span>
                <span className={`text-xs font-bold ${textColor}`}>{score}%</span>
            </div>
            <div className={`${large ? 'h-3' : 'h-2'} bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden`}>
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
            </div>
        </div>
    );
}

export default function RoomTimeline() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [room, setRoom] = useState(null);
    const [logs, setLogs] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch logs for this room
            const logsRes = await fetch(`/api/maintenance?room_id=${id}`, { headers });
            const logsData = await logsRes.json();
            setLogs(logsData.logs || []);

            // Get room info from first log or separate call
            if (logsData.logs && logsData.logs.length > 0) {
                const first = logsData.logs[0];
                setRoom({
                    room_number: first.room_number,
                    module_name: first.module_name,
                    floor_code: first.floor_code,
                    module_number: first.module_number,
                });
            }

            // Get prediction
            const predRes = await fetch('/api/maintenance/predictions', { headers });
            const predData = await predRes.json();
            const matched = (predData.predictions || []).find(p => p.room_id === parseInt(id));
            setPrediction(matched || null);
        } catch { }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <div className="py-6 px-4 lg:px-8 w-full flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    return (
        <div className="py-6 px-4 lg:px-8 w-full">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-1">
                        <button
                            onClick={() => navigate('/maintenance')}
                            aria-label="Volver al historial"
                            title="Volver al historial"
                            className="p-2.5 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10">
                            <DoorOpen className="w-6 h-6 text-[var(--color-primary)]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                                Habitación {room?.room_number || id}
                            </h1>
                            {room && (
                                <p className="text-sm text-[var(--color-text-secondary)]">
                                    {room.module_name} · {room.floor_code}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Prediction card */}
                {prediction && (
                    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                            <Battery className="w-4 h-4 text-green-500" />
                            Predicción de Batería
                        </h3>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Último cambio</p>
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{formatDate(prediction.last_battery_change)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Próximo estimado</p>
                                <p className={`text-sm font-bold ${prediction.days_remaining <= 10 ? 'text-red-500' : prediction.days_remaining <= 30 ? 'text-yellow-500' : 'text-green-500'}`}>
                                    {formatDate(prediction.estimated_next_change)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Promedio entre cambios</p>
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{prediction.avg_days_between_changes} días</p>
                            </div>
                        </div>
                        <HealthBar score={prediction.health_score} large />
                    </div>
                )}

                {/* Timeline */}
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-[var(--color-text-primary)]">Historial de Mantenimiento</h3>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{logs.length} {logs.length === 1 ? 'registro' : 'registros'}</p>
                        </div>
                    </div>

                    {logs.length === 0 ? (
                        <div className="p-12 text-center">
                            <Wrench className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3" />
                            <p className="text-sm text-[var(--color-text-secondary)]">Sin registros de mantenimiento para esta habitación</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-7 top-0 bottom-0 w-px bg-[var(--color-border)]" />

                            {logs.map((log, idx) => {
                                const isBattery = log.type === 'battery';
                                return (
                                    <div key={log.id} className="relative flex gap-4 px-4 py-4 hover:bg-[var(--color-bg-tertiary)] transition-colors">
                                        {/* Dot */}
                                        <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isBattery ? 'bg-green-500/15' : 'bg-orange-500/15'
                                            }`}>
                                            {isBattery
                                                ? <Battery className="w-3.5 h-3.5 text-green-600" />
                                                : <Cog className="w-3.5 h-3.5 text-orange-600" />
                                            }
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-md border ${isBattery
                                                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                                        : 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                                                    }`}>
                                                    {isBattery ? 'Cambio de Batería' : 'Reparación Mecánica'}
                                                </span>
                                                {log.part_name && (
                                                    <span className="text-xs text-[var(--color-text-muted)]">· {log.part_name}</span>
                                                )}
                                            </div>
                                            {log.description && (
                                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{log.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-1.5">
                                                <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {formatDate(log.performed_at)}
                                                </span>
                                                {log.user_name && (
                                                    <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                                                        <User className="w-3 h-3" /> {log.user_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
