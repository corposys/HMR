import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calculator, RefreshCw, DollarSign } from 'lucide-react';
import Button from '@shared/common/Button';
import Card from '@shared/common/Card';
import Input from '@shared/common/Input';
import CustomDropdown from '@shared/common/CustomDropdown';
import { useQuote } from '@hooks/useQuote';
import { useOccupancyConfigs } from '@hooks/useOccupancyConfigs';
import { apiFetch } from '@utils/api';
import { formatCurrency } from '@utils/formatters';

export default function QuoteTester() {
    const { quote, loading, error, fetchQuote, resetQuote } = useQuote();
    const { items: occupancyConfigs, fetchConfigs } = useOccupancyConfigs();
    const [roomTypes, setRoomTypes] = useState([]);
    const [plans, setPlans] = useState([]);
    const [params, setParams] = useState({
        room_type_id: '',
        check_in: '',
        check_out: '',
        occupancy_code: 'SGL_DBL',
        num_adults: 2,
        num_children: 0,
        children_ages: '',
        plan_id: '',
    });

    useEffect(() => {
        fetchConfigs();
        async function loadData() {
            try {
                const [rtData, planData] = await Promise.all([
                    apiFetch('/api/settings/room-types'),
                    apiFetch('/api/settings/reservation-plans'),
                ]);
                setRoomTypes(rtData.room_types || []);
                setPlans(planData.plans || []);
            } catch (err) {
                console.error(err);
            }
        }
        loadData();
    }, [fetchConfigs]);

    const occupancyOptions = useMemo(() =>
        occupancyConfigs.filter((c) => c.is_active).map((c) => ({
            value: c.code,
            label: `${c.label} (${c.min_pax === c.max_pax ? c.min_pax : `${c.min_pax}-${c.max_pax}`} pax)`,
        })),
    [occupancyConfigs]);

    const roomTypeOptions = useMemo(() => [
        { value: '', label: 'Seleccionar tipo' },
        ...roomTypes.map((rt) => ({ value: String(rt.id), label: rt.name })),
    ], [roomTypes]);

    const planOptions = useMemo(() => [
        { value: '', label: 'Sin plan' },
        ...plans.map((p) => ({ value: String(p.id), label: p.name })),
    ], [plans]);

    const handleCalculate = useCallback(() => {
        if (!params.room_type_id || !params.check_in || !params.check_out) return;
        const query = {
            room_type_id: params.room_type_id,
            check_in: params.check_in,
            check_out: params.check_out,
            occupancy_code: params.occupancy_code,
            num_adults: params.num_adults,
            num_children: params.num_children,
        };
        if (params.children_ages) query.children_ages = params.children_ages;
        if (params.plan_id) query.plan_id = params.plan_id;
        fetchQuote(query);
    }, [params, fetchQuote]);

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Cotizador</h2>
                <p className="text-sm text-[var(--color-text-muted)]">Calcula tarifas para un rango de fechas específico</p>
            </div>

            <Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <CustomDropdown
                        value={params.room_type_id}
                        onChange={(v) => setParams((p) => ({ ...p, room_type_id: v }))}
                        options={roomTypeOptions}
                        placeholder="Tipo de habitación"
                    />
                    <Input
                        label="Check-in"
                        type="date"
                        value={params.check_in}
                        onChange={(e) => setParams((p) => ({ ...p, check_in: e.target.value }))}
                    />
                    <Input
                        label="Check-out"
                        type="date"
                        value={params.check_out}
                        onChange={(e) => setParams((p) => ({ ...p, check_out: e.target.value }))}
                    />
                    <CustomDropdown
                        value={params.occupancy_code}
                        onChange={(v) => setParams((p) => ({ ...p, occupancy_code: v }))}
                        options={occupancyOptions}
                        placeholder="Ocupación"
                    />
                    <CustomDropdown
                        value={params.plan_id}
                        onChange={(v) => setParams((p) => ({ ...p, plan_id: v }))}
                        options={planOptions}
                        placeholder="Plan"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            label="Adultos"
                            type="number"
                            min="1"
                            value={params.num_adults}
                            onChange={(e) => setParams((p) => ({ ...p, num_adults: parseInt(e.target.value) || 1 }))}
                        />
                        <Input
                            label="Niños"
                            type="number"
                            min="0"
                            value={params.num_children}
                            onChange={(e) => setParams((p) => ({ ...p, num_children: parseInt(e.target.value) || 0 }))}
                        />
                    </div>
                    {params.num_children > 0 && (
                        <Input
                            label="Edades (separadas por coma)"
                            placeholder="4,7,10"
                            value={params.children_ages}
                            onChange={(e) => setParams((p) => ({ ...p, children_ages: e.target.value }))}
                        />
                    )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <Button icon={Calculator} onClick={handleCalculate} loading={loading}>
                        Calcular
                    </Button>
                    <Button variant="ghost" onClick={resetQuote}>Limpiar</Button>
                </div>
            </Card>

            {error && (
                <div className="p-4 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
                    {error}
                </div>
            )}

            {quote && (
                <Card>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Resultado de la Cotización</h3>
                            <span className="text-sm text-[var(--color-text-muted)]">{quote.nights} noche(s)</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {quote.nightly_breakdown.map((night) => (
                                <div key={night.date} className="p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                                    <div className="text-xs text-[var(--color-text-muted)]">{night.date}</div>
                                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{formatCurrency(night.rate_usd)}</div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-[var(--color-text-secondary)]">Total noches</span>
                                <span className="font-medium">{formatCurrency(quote.total_nightly_usd)}</span>
                            </div>
                            {quote.plan_multiplier !== 1 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--color-text-secondary)]">Multiplicador plan ({quote.plan_multiplier}x)</span>
                                    <span className="font-medium">{formatCurrency(quote.subtotal_usd)}</span>
                                </div>
                            )}
                            {quote.children_total_usd > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--color-text-secondary)]">Niños</span>
                                    <span className="font-medium">{formatCurrency(quote.children_total_usd)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-[var(--color-border)]">
                                <span className="text-[var(--color-text-primary)]">Total</span>
                                <span className="text-[var(--color-primary)]">{formatCurrency(quote.grand_total_usd)}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}
