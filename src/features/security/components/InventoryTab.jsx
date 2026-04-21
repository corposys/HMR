import React, { useState } from 'react';
import { 
    Car, 
    AlertTriangle,
    Plus,
    Bus,
    Truck,
    Pencil,
    Trash2,
    X
} from 'lucide-react';
import Card from '@shared/common/Card';
import Button from '@shared/common/Button';

export default function InventoryTab() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const inventoryData = [
        { id: 'V-001', type: 'Autobús', make: 'Mercedes-Benz', model: 'Sprinter 515', year: 2022, fuel: 'Diésel', plate: 'PA-902-KL', status: 'Activo', mileage: 45200, nextService: 50000 },
        { id: 'V-002', type: 'Autobús', make: 'Volvo', model: 'O500', year: 2021, fuel: 'Diésel', plate: 'XT-114-ZW', status: 'Mantenimiento', mileage: 62400, nextService: 62500 },
        { id: 'V-003', type: 'Camioneta', make: 'Toyota', model: 'Hilux', year: 2023, fuel: 'Gasolina', plate: 'LM-339-BQ', status: 'Activo', mileage: 24100, nextService: 30000 },
        { id: 'V-004', type: 'Sedán', make: 'Toyota', model: 'Corolla', year: 2020, fuel: 'Gasolina', plate: 'RK-775-PL', status: 'Inactivo', mileage: 89000, nextService: 90000 },
        { id: 'V-005', type: 'Camioneta', make: 'Ford', model: 'Ranger', year: 2024, fuel: 'Diésel', plate: 'DF-441-NN', status: 'Activo', mileage: 8500, nextService: 10000 },
        { id: 'V-006', type: 'Sedán', make: 'Nissan', model: 'Sentra', year: 2022, fuel: 'Gasolina', plate: 'BG-228-CV', status: 'Activo', mileage: 34800, nextService: 35000 },
    ];

    const getVehicleIcon = (type) => {
        switch (type) {
            case 'Autobús': return <Bus className="w-5 h-5" />;
            case 'Camioneta': return <Truck className="w-5 h-5" />;
            default: return <Car className="w-5 h-5" />;
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Activo': return 'text-[var(--color-success)] bg-[var(--color-success)]/10';
            case 'Mantenimiento': return 'text-[var(--color-warning)] bg-[var(--color-warning)]/10';
            case 'Inactivo': return 'text-[var(--color-danger)] bg-[var(--color-danger)]/10';
            default: return 'text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)]';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">Directorio de Vehículos</h3>
                <Button variant="register" onClick={() => setIsModalOpen(true)} icon={Plus}>Añadir Vehículo</Button>
            </div>

            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
                                <th className="p-4 font-medium">ID / Tipo</th>
                                <th className="p-4 font-medium">Vehículo</th>
                                <th className="p-4 font-medium text-center">Placa</th>
                                <th className="p-4 font-medium text-center">Estado</th>
                                <th className="p-4 font-medium text-right">Kilometraje</th>
                                <th className="p-4 font-medium text-right w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {inventoryData.map((vehicle) => {
                                const diffKm = vehicle.nextService - vehicle.mileage;
                                const needsServiceSoon = diffKm <= 1000 && diffKm > 0;
                                
                                return (
                                    <tr key={vehicle.id} className="group hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                                                    {getVehicleIcon(vehicle.type)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--color-text-primary)]">{vehicle.id}</p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">{vehicle.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium text-[var(--color-text-primary)]">{vehicle.make} {vehicle.model}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">{vehicle.year} • {vehicle.fuel}</p>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-mono text-sm font-medium tracking-wider bg-gray-900 text-gray-100 px-2.5 py-1 rounded shadow-inner border border-gray-700">
                                                {vehicle.plate}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(vehicle.status)}`}>
                                                {vehicle.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <p className="font-medium text-[var(--color-text-primary)]">{vehicle.mileage.toLocaleString()} km</p>
                                            {needsServiceSoon ? (
                                                <p className="text-xs text-[var(--color-warning)] mt-0.5 font-medium flex items-center justify-end gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Próx: {vehicle.nextService.toLocaleString()}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                                    Próx: {vehicle.nextService.toLocaleString()}
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1.5 rounded-md hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 rounded-md hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal Añadir Vehículo */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-bg-primary)] z-10">
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Añadir Nuevo Vehículo</h2>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-8">
                            {/* Datos Generales */}
                            <section>
                                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4 uppercase tracking-wider">Datos Generales</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">ID Interno</label>
                                        <input type="text" placeholder="Ej. V-015" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Tipo de Vehículo</label>
                                        <select className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none">
                                            <option value="">Seleccionar tipo...</option>
                                            <option value="sedan">Sedán</option>
                                            <option value="suv">Camioneta / SUV</option>
                                            <option value="bus">Autobús / Van</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Marca</label>
                                        <input type="text" placeholder="Ej. Toyota" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Modelo</label>
                                        <input type="text" placeholder="Ej. Hiace" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Año</label>
                                        <input type="number" placeholder="Ej. 2024" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Placas</label>
                                        <input type="text" placeholder="Ej. ABC-123-X" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors font-mono" />
                                    </div>
                                </div>
                            </section>

                            <hr className="border-[var(--color-border)]" />

                            {/* Datos Técnicos */}
                            <section>
                                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4 uppercase tracking-wider">Datos Técnicos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Kilometraje Inicial</label>
                                        <div className="relative">
                                            <input type="number" placeholder="0" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg pl-4 pr-12 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">km</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Próximo Servicio</label>
                                        <div className="relative">
                                            <input type="number" placeholder="5000" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg pl-4 pr-12 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">km</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Tipo de Combustible</label>
                                        <select className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none">
                                            <option value="">Seleccionar...</option>
                                            <option value="gasolina">Gasolina</option>
                                            <option value="diesel">Diésel</option>
                                            <option value="hibrido">Híbrido</option>
                                            <option value="electrico">Eléctrico</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Capacidad de Tanque</label>
                                        <div className="relative">
                                            <input type="number" placeholder="0" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg pl-4 pr-12 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm">L</span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                        
                        <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-3 bg-[var(--color-bg-tertiary)]/50 mt-auto">
                            <Button className="!rounded-full" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                            <Button className="!rounded-full" variant="primary">Guardar Vehículo</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}