import React, { useState } from 'react';
import { 
    Calendar, 
    MapPin, 
    Fuel, 
    Save,
    Clock,
    AlertCircle
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@shared/common/Card';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';

export default function DailyLogsTab() {
    // Mock data for UI
    const activeVehicles = [
        { id: 'V-001', label: 'V-001 (Autobús - Sprinter 515)' },
        { id: 'V-002', label: 'V-002 (Autobús - Volvo O500)' },
        { id: 'V-003', label: 'V-003 (Camioneta - Hilux)' },
        { id: 'V-005', label: 'V-005 (Camioneta - Ranger)' },
        { id: 'V-006', label: 'V-006 (Sedán - Sentra)' },
    ];

    const todayHistory = [
        {
            id: 1,
            vehicle: 'V-003',
            model: 'Camioneta - Hilux',
            driver: 'Carlos Díaz',
            time: '08:30 AM',
            initialKm: 24100,
            finalKm: 24145,
            liters: 0,
            cost: 0,
            observations: 'Traslado de personal gerencial al centro de convenciones.'
        },
        {
            id: 2,
            vehicle: 'V-001',
            model: 'Autobús - Sprinter 515',
            driver: 'José Pérez',
            time: '10:15 AM',
            initialKm: 45200,
            finalKm: 45280,
            liters: 60,
            cost: 45.00,
            observations: 'Ruta hotel-aeropuerto-hotel. Carga de combustible en la estación de servicio Aeropuerto.'
        },
        {
            id: 3,
            vehicle: 'V-006',
            model: 'Sedán - Sentra',
            driver: 'Alberto Gómez',
            time: '01:45 PM',
            initialKm: 34800,
            finalKm: 34815,
            liters: 0,
            cost: 0,
            observations: 'Compra de insumos de emergencia en supermercado local.'
        }
    ];

    return (
        <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column: Form */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader className="pb-4 border-b border-[var(--color-border)] mb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Save className="w-5 h-5 text-[var(--color-primary)]" />
                                Nuevo Registro
                            </CardTitle>
                        </CardHeader>
                        
                        <CardContent>
                            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Vehículo</label>
                                    <select className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none">
                                        <option value="">Seleccione un vehículo...</option>
                                        {activeVehicles.map(v => (
                                            <option key={v.id} value={v.id}>{v.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Chofer Asignado</label>
                                    <input type="text" placeholder="Ej. Juan Pérez" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Km Inicial</label>
                                        <input type="number" placeholder="0" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Km Final</label>
                                        <input type="number" placeholder="0" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                    </div>
                                </div>

                                {/* Contenedor de Combustible - Destacado */}
                                <div className="p-4 rounded-xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 space-y-3 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--color-primary)]/10 rounded-bl-full -z-10 pointer-events-none"></div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Fuel className="w-4 h-4 text-[var(--color-primary)]" />
                                        <label className="text-sm font-semibold text-[var(--color-text-primary)]">Carga de Combustible (Opcional)</label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <div className="relative">
                                                <input type="number" placeholder="0" className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg pl-4 pr-8 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">L</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">$</span>
                                                <input type="number" placeholder="0.00" step="0.01" className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Observaciones</label>
                                    <textarea 
                                        rows="3" 
                                        placeholder="Motivo del viaje, incidencias, etc..." 
                                        className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
                                    ></textarea>
                                </div>

                                <Button className="w-full !rounded-full mt-2" variant="primary">Guardar Registro</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: History */}
                <div className="lg:col-span-2">
                    <Card padding="none" className="h-full flex flex-col border-[var(--color-border)] overflow-hidden">
                        {/* Header Historial */}
                        <div className="p-5 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/50 shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Historial de Hoy</h3>
                            </div>
                            <span className="text-sm font-medium px-2.5 py-1 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-full text-[var(--color-text-secondary)] shadow-sm">
                                {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                        </div>

                        {/* Listado con Scroll */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar min-h-[500px]">
                            {todayHistory.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] space-y-3">
                                    <AlertCircle className="w-12 h-12 opacity-20" />
                                    <p>No hay registros para el día de hoy.</p>
                                </div>
                            ) : (
                                todayHistory.map((log) => {
                                    const recorrido = log.finalKm - log.initialKm;
                                    const hasFuel = log.liters > 0;

                                    return (
                                        <div key={log.id} className="relative pl-6 pb-2 group">
                                            {/* Línea conectora */}
                                            <div className="absolute left-[11px] top-8 bottom-0 w-px bg-[var(--color-border)] group-last:bg-transparent"></div>
                                            
                                            {/* Tarjeta de Registro */}
                                            <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                                
                                                {/* Icono Absoluto/Marcador */}
                                                <div className="absolute left-0 top-5 w-[23px] h-[23px] bg-[var(--color-bg-primary)] border-2 border-[var(--color-primary)] rounded-full flex items-center justify-center z-10 shadow-sm">
                                                    <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full"></div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                    
                                                    {/* Info Principal */}
                                                    <div className="space-y-2 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                                                                <MapPin className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                                {log.vehicle} <span className="font-normal text-sm text-[var(--color-text-muted)]">({log.model})</span>
                                                            </h4>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                                                            <span className="font-medium text-[var(--color-text-primary)]">{log.driver}</span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {log.time}</span>
                                                        </div>

                                                        <p className="text-sm italic text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)]/50 p-2 rounded-lg border border-[var(--color-border)]/50">
                                                            "{log.observations}"
                                                        </p>
                                                    </div>

                                                    {/* Métricas y Badges */}
                                                    <div className="flex flex-row sm:flex-col items-end gap-2 shrink-0">
                                                        <div className="text-right">
                                                            <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">Recorrido</p>
                                                            <p className="font-mono font-medium text-[var(--color-text-primary)]">
                                                                {recorrido} km
                                                            </p>
                                                        </div>

                                                        {hasFuel && (
                                                            <Badge variant="success" className="gap-1.5 text-sm whitespace-nowrap">
                                                                <Fuel className="w-4 h-4" />
                                                                +{log.liters}L <span className="opacity-70 text-xs">(${log.cost.toFixed(2)})</span>
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Footer Mini: Km Inicial/Final */}
                                                <div className="mt-4 pt-3 border-t border-[var(--color-border)]/50 flex items-center gap-4 text-xs font-mono text-[var(--color-text-muted)]">
                                                    <span>Inicio: {log.initialKm}</span>
                                                    <span className="h-3 w-px bg-[var(--color-border)]"></span>
                                                    <span>Fin: {log.finalKm}</span>
                                                </div>

                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </div>

            </div>
        </div>
    );
}