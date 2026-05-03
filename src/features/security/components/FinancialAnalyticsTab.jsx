import React from 'react';
import { 
    Download,
    TrendingUp,
    TrendingDown,
    Activity,
    Fuel,
    AlertOctagon,
    PieChart,
    Car
} from 'lucide-react';
import Card from '@shared/common/Card';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';

export default function FinancialAnalyticsTab() {
    // Configuración global
    const FUEL_PRICE_USD = 0.50; // Tarifa referencial internacional

    // Mock Data de la flota
    const financialData = [
        { id: 'V-001', make: 'Mercedes-Benz', model: 'Sprinter 515', plate: 'PA-902-KL', type: 'Autobús', distanceKm: 2800, fuelLiters: 420, maintenanceCost: 320.00, expectedKmL: 7.5 },
        { id: 'V-002', make: 'Volvo', model: 'O500', plate: 'XT-114-ZW', type: 'Autobús', distanceKm: 3100, fuelLiters: 939, maintenanceCost: 80.00, expectedKmL: 5.0 }, // Alerta: 3.3 km/L (Muy bajo)
        { id: 'V-003', make: 'Toyota', model: 'Hilux', plate: 'LM-339-BQ', type: 'Camioneta', distanceKm: 1800, fuelLiters: 205, maintenanceCost: 0, expectedKmL: 8.5 },
        { id: 'V-004', make: 'Toyota', model: 'Corolla', plate: 'RK-775-PL', type: 'Sedán', distanceKm: 2200, fuelLiters: 190, maintenanceCost: 210.00, expectedKmL: 12.0 },
        { id: 'V-005', make: 'Ford', model: 'Ranger', plate: 'DF-441-NN', type: 'Camioneta', distanceKm: 1500, fuelLiters: 454, maintenanceCost: 65.00, expectedKmL: 8.0 }, // Alerta: 3.3 km/L (Muy bajo)
        { id: 'V-006', make: 'Nissan', model: 'Sentra', plate: 'BG-228-CV', type: 'Sedán', distanceKm: 2400, fuelLiters: 180, maintenanceCost: 0, expectedKmL: 13.0 },
    ];

    // Cálculos Dinámicos
    const processedData = financialData.map(vehicle => {
        const fuelCost = vehicle.fuelLiters * FUEL_PRICE_USD;
        const totalCost = fuelCost + vehicle.maintenanceCost;
        const efficiency = vehicle.distanceKm / vehicle.fuelLiters;
        const cpk = totalCost / vehicle.distanceKm;
        const isAnomaly = efficiency < (vehicle.expectedKmL * 0.6); // Considerado anomalía si rinde menos del 60% de lo esperado

        return {
            ...vehicle,
            fuelCost,
            totalCost,
            efficiency: efficiency.toFixed(1),
            cpk: cpk.toFixed(2),
            isAnomaly
        };
    });

    const totalFuelCost = processedData.reduce((acc, curr) => acc + curr.fuelCost, 0);
    const totalMaintenanceCost = processedData.reduce((acc, curr) => acc + curr.maintenanceCost, 0);
    const totalOperativeCost = totalFuelCost + totalMaintenanceCost;
    const totalDistance = processedData.reduce((acc, curr) => acc + curr.distanceKm, 0);
    const avgCPK = totalDistance > 0 ? (totalOperativeCost / totalDistance).toFixed(2) : 0;

    const anomalies = processedData.filter(v => v.isAnomaly);

    // Helpers para Tailwind Classes
    const getEfficiencyVariant = (actual, expected) => {
        const ratio = actual / expected;
        if (ratio >= 0.9) return 'success';
        if (ratio >= 0.7) return 'warning';
        return 'danger';
    };

    const getCPKVariant = (cpk, type) => {
        let threshold = 0.15;
        if (type === 'Camioneta') threshold = 0.25;
        if (type === 'Autobús') threshold = 0.40;

        if (cpk <= threshold) return 'success';
        if (cpk <= threshold * 1.5) return 'warning';
        return 'danger';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Analítica Financiera</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Rentabilidad, mermas de combustible y CPK (Costo por Kilómetro)</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="primary" icon={Download} className="!rounded-full shadow-sm w-full sm:w-auto">Exportar Reporte</Button>
                </div>
            </div>

            {/* Fila Superior: Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Combustible */}
                <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-muted)]">Costo Combustible (Mes)</p>
                            <h4 className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">${totalFuelCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h4>
                        </div>
                        <div className="p-2.5 bg-blue-500/10 rounded-lg">
                            <Fuel className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="flex items-center text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded font-medium">
                            <TrendingUp className="w-3.5 h-3.5 mr-1" /> +8.4%
                        </span>
                        <span className="text-[var(--color-text-muted)]">vs mes anterior</span>
                    </div>
                </div>

                {/* Total Operativo */}
                <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-muted)]">Costo Total Operativo</p>
                            <h4 className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">${totalOperativeCost.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h4>
                        </div>
                        <div className="p-2.5 bg-purple-500/10 rounded-lg">
                            <PieChart className="w-5 h-5 text-purple-500" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="flex items-center text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">
                            <TrendingDown className="w-3.5 h-3.5 mr-1" /> -2.1%
                        </span>
                        <span className="text-[var(--color-text-muted)]">vs mes anterior</span>
                    </div>
                </div>

                {/* Promedio CPK */}
                <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm font-medium text-[var(--color-text-muted)]">Promedio General CPK</p>
                            <h4 className="text-2xl font-bold text-[var(--color-text-primary)] mt-1">${avgCPK} <span className="text-sm font-normal text-[var(--color-text-muted)]">/ km</span></h4>
                        </div>
                        <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                            <Activity className="w-5 h-5 text-emerald-500" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <span className="flex items-center text-emerald-500 font-medium">
                            Óptimo
                        </span>
                        <span className="text-[var(--color-text-muted)]">• Rendimiento de flota estable</span>
                    </div>
                </div>
            </div>

            {/* Bloque Medio: Panel de Alertas de Merma */}
            {anomalies.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl overflow-hidden mt-6 mb-6">
                    <div className="bg-amber-500/10 px-5 py-3 border-b border-amber-500/20 flex items-center gap-2">
                        <AlertOctagon className="w-5 h-5 text-amber-600" />
                        <h4 className="font-semibold text-amber-700 dark:text-amber-500">Alertas de Rendimiento Anormal (Posible Merma)</h4>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {anomalies.map(anomaly => (
                            <div key={anomaly.id} className="bg-[var(--color-bg-primary)] border border-rose-500/30 rounded-lg p-4 flex gap-4 shadow-sm relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                                <div className="p-2 bg-rose-500/10 rounded-full h-fit">
                                    <Fuel className="w-5 h-5 text-rose-500" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-[var(--color-text-primary)]">{anomaly.id}</span>
                                        <span className="text-sm text-[var(--color-text-muted)]">({anomaly.plate})</span>
                                    </div>
                                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                                        Rendimiento actual de <span className="font-bold text-rose-500">{anomaly.efficiency} km/L</span> 
                                        {' '}cuando el esperado es de {anomaly.expectedKmL} km/L.
                                    </p>
                                    <p className="text-xs text-rose-600 font-medium mt-1 bg-rose-500/10 inline-block px-2 py-1 rounded">
                                        Requiere auditoría: Posible extracción de combustible.
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bloque Inferior: Tabla Detallada CPK */}
            <Card padding="none" className="overflow-hidden">
                <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-tertiary)]/30">
                    <h4 className="font-medium text-[var(--color-text-primary)]">Desglose de Costo por Kilómetro (Unidad por Unidad)</h4>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                                <th className="p-4 font-medium">Vehículo</th>
                                <th className="p-4 font-medium text-right">Recorrido (Mes)</th>
                                <th className="p-4 font-medium text-right">Combustible</th>
                                <th className="p-4 font-medium text-right">Costo Total</th>
                                <th className="p-4 font-medium text-center">Eficiencia</th>
                                <th className="p-4 font-medium text-right">CPK</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)] text-sm">
                            {processedData.map((row) => (
                                <tr key={row.id} className="hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-[var(--color-bg-tertiary)] flex items-center justify-center border border-[var(--color-border)] shrink-0">
                                                <Car className="w-4 h-4 text-[var(--color-text-muted)]" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-[var(--color-text-primary)]">{row.id} • {row.make} {row.model}</p>
                                                <p className="text-xs font-mono text-[var(--color-text-muted)]">{row.plate}</p>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="p-4 text-right">
                                        <span className="font-mono text-[var(--color-text-primary)]">{row.distanceKm.toLocaleString()} km</span>
                                    </td>
                                    
                                    <td className="p-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-mono text-[var(--color-text-primary)]">{row.fuelLiters} L</span>
                                            <span className="text-xs text-[var(--color-text-muted)]">${row.fuelCost.toFixed(2)}</span>
                                        </div>
                                    </td>
                                    
                                    <td className="p-4 text-right">
                                        <span className="font-mono font-medium text-[var(--color-text-primary)]">
                                            ${row.totalCost.toFixed(2)}
                                        </span>
                                        {row.maintenanceCost > 0 && (
                                            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5" title="Mantenimiento incluido">
                                                + ${row.maintenanceCost} mant.
                                            </p>
                                        )}
                                    </td>
                                    
                                    <td className="p-4 text-center">
<Badge variant={getEfficiencyVariant(row.efficiency, row.expectedKmL)} className="font-mono font-bold">
                                                {row.efficiency} km/L
                                            </Badge>
                                    </td>
                                    
                                    <td className="p-4 text-right">
<Badge variant={getCPKVariant(row.cpk, row.type)} className="font-mono text-base font-bold">
                                                ${row.cpk}
                                            </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
