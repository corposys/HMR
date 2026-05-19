import { CalendarDays, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { apiJson } from '@utils/api';
import { useToast } from '@context/ToastContext';

export default function ReservationsTab() {
    const { showToast } = useToast();
    const [roomTypes, setRoomTypes] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [typesData, plansData] = await Promise.all([
                apiJson('/api/settings/room-types'),
                apiJson('/api/settings/reservation-plans'),
            ]);
            setRoomTypes(typesData.room_types || []);
            setPlans(plansData.plans || []);
        } catch {
            showToast({ title: 'Error', message: 'No se pudieron cargar los datos', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                    <CalendarDays className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">Reservas</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">Check-in, check-out, tipos de habitación y planes</p>
                </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Tipos de Habitación</h3>
                    <Button size="sm" variant="outline"><Plus className="w-4 h-4" /> Añadir</Button>
                </div>
                {loading ? (
                    <p className="text-sm text-[var(--color-text-muted)]">Cargando...</p>
                ) : roomTypes.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)]">No hay tipos de habitación</p>
                ) : (
                    <div className="space-y-2">
                        {roomTypes.map((rt) => (
                            <div key={rt.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
                                <div>
                                    <p className="font-medium text-sm">{rt.name}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">Máx. {rt.max_occupancy} personas · ${rt.default_rate_usd}/noche</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-1.5 hover:bg-[var(--color-bg-tertiary)] rounded"><Pencil className="w-3.5 h-3.5" /></button>
                                    <button className="p-1.5 hover:bg-red-500/10 rounded text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Planes de Reserva</h3>
                    <Button size="sm" variant="outline"><Plus className="w-4 h-4" /> Añadir</Button>
                </div>
                {loading ? (
                    <p className="text-sm text-[var(--color-text-muted)]">Cargando...</p>
                ) : plans.length === 0 ? (
                    <p className="text-sm text-[var(--color-text-muted)]">No hay planes de reserva</p>
                ) : (
                    <div className="space-y-2">
                        {plans.map((plan) => (
                            <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)]">
                                <div>
                                    <p className="font-medium text-sm">{plan.name}</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        {plan.includes_breakfast && 'Desayuno '} {plan.includes_all_meals && 'Todas las comidas'} {plan.includes_drinks && 'Bebidas'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[var(--color-primary)]">x{plan.rate_multiplier}</span>
                                    <button className="p-1.5 hover:bg-[var(--color-bg-tertiary)] rounded"><Pencil className="w-3.5 h-3.5" /></button>
                                    <button className="p-1.5 hover:bg-red-500/10 rounded text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}