import React, { useState } from 'react';
import { 
    User, 
    AlertTriangle,
    Plus,
    CheckCircle2,
    Search,
    Pencil,
    Trash2,
    X,
    FileText
} from 'lucide-react';
import Card from '@shared/common/Card';
import Button from '@shared/common/Button';

export default function DriversTab() {
    const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

    const driversData = [
        { id: 1, name: 'Carlos Díaz', ci: 'V-15.420.192', phone: '0414-555-0123', licenseType: '5ta', licenseExpiry: '2024-03-15', status: 'Activo' },
        { id: 2, name: 'José Pérez', ci: 'V-18.992.301', phone: '0424-555-9876', licenseType: '4ta', licenseExpiry: '2024-02-28', status: 'Inactivo' },
        { id: 3, name: 'Manuel Rodríguez', ci: 'V-12.334.567', phone: '0412-555-4433', licenseType: '5ta', licenseExpiry: '2025-10-10', status: 'Activo' },
        { id: 4, name: 'Luis Silva', ci: 'V-20.111.222', phone: '0416-555-7788', licenseType: '3ra', licenseExpiry: '2023-12-01', status: 'Suspendido' }, // Vencida
        { id: 5, name: 'Alberto Gómez', ci: 'E-81.233.444', phone: '0424-555-1122', licenseType: '4ta', licenseExpiry: '2024-09-05', status: 'Activo' },
    ];

    const getLicenseStatus = (expiryDateString) => {
        const expiryDate = new Date(expiryDateString);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Vencida', class: 'text-[var(--color-danger)] font-bold' };
        if (diffDays <= 30) return { label: `Vence en ${diffDays} días`, class: 'text-[var(--color-warning)] font-medium' };
        return { label: 'Vigente', class: 'text-[var(--color-text-muted)]' };
    };

    const getDriverStatusStyle = (status) => {
        switch (status) {
            case 'Activo': return 'text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/20';
            case 'Inactivo': return 'text-[var(--color-warning)] bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20';
            case 'Suspendido': return 'text-[var(--color-danger)] bg-[var(--color-danger)]/10 border-[var(--color-danger)]/20';
            default: return 'text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)]';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input 
                        type="text" 
                        placeholder="Buscar por cédula o nombre..." 
                        className="w-full pl-9 pr-4 py-2 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                    />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <Button variant="register" icon={FileText}>Exportar</Button>
                    <Button variant="register" onClick={() => setIsVehicleModalOpen(true)} icon={Plus}>Añadir</Button>
                </div>
            </div>

            <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)] text-sm text-[var(--color-text-secondary)]">
                                <th className="p-4 font-medium min-w-[200px]">Chofer / C.I.</th>
                                <th className="p-4 font-medium">Contacto</th>
                                <th className="p-4 font-medium text-center">Licencia</th>
                                <th className="p-4 font-medium">Vencimiento (CRÍTICO)</th>
                                <th className="p-4 font-medium text-center">Estado</th>
                                <th className="p-4 font-medium text-right w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {driversData.map((driver) => {
                                const licenseStatus = getLicenseStatus(driver.licenseExpiry);
                                const isExpired = licenseStatus.label === 'Vencida';
                                
                                return (
                                    <tr key={driver.id} className="group hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-secondary)] overflow-hidden">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[var(--color-text-primary)]">{driver.name}</p>
                                                    <p className="text-sm font-mono text-[var(--color-text-muted)]">{driver.ci}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm text-[var(--color-text-primary)]">{driver.phone}</p>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-sm">
                                                {driver.licenseType.replace('ta', '').replace('ra', '')}
                                                <span className="text-[10px] ml-0.5 mt-0.5">{driver.licenseType.includes('ta') ? 'ta' : 'ra'}</span>
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-sm text-[var(--color-text-primary)]">
                                                    {new Date(driver.licenseExpiry).toLocaleDateString('es-VE')}
                                                </p>
                                                <p className={`text-xs flex items-center gap-1 ${licenseStatus.class}`}>
                                                    {isExpired ? <AlertTriangle className="w-3 h-3" /> : (licenseStatus.label.includes('Vence en') ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />)}
                                                    {licenseStatus.label}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getDriverStatusStyle(driver.status)}`}>
                                                {driver.status}
                                            </span>
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

            {/* Modal Añadir Chofer */}
            {isDriverModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl shadow-xl w-full max-w-lg flex flex-col slide-in-from-bottom-4 duration-300">
                        {/* Header Modal */}
                        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Registrar Nuevo Chofer</h2>
                            <button 
                                onClick={() => setIsDriverModalOpen(false)}
                                className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Body Modal */}
                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-[var(--color-text-primary)]">Nombre Completo</label>
                                    <input type="text" placeholder="Ej. Juan Pérez" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Cédula de Identidad</label>
                                        <div className="flex gap-2">
                                            <select className="w-20 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none text-center">
                                                <option>V-</option>
                                                <option>E-</option>
                                            </select>
                                            <input type="text" placeholder="12.345.678" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors font-mono" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Teléfono</label>
                                        <input type="tel" placeholder="0414-000-0000" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors" />
                                    </div>
                                </div>

                                <hr className="border-[var(--color-border)]" />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)]">Grado de Licencia</label>
                                        <select className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors appearance-none">
                                            <option value="">Seleccionar...</option>
                                            <option value="3ra">3ra (Particular/Pasajeros hasta 9)</option>
                                            <option value="4ta">4ta (Carga Liviana)</option>
                                            <option value="5ta">5ta (Carga Pesada/Transporte)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-1">
                                            Vencimiento <AlertTriangle className="w-3 h-3 text-[var(--color-warning)]" />
                                        </label>
                                        <input type="date" className="w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors text-[var(--color-text-primary)] [color-scheme:dark]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer Modal */}
                        <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-3 bg-[var(--color-bg-tertiary)]/50 rounded-b-xl">
                            <Button className="!rounded-full" variant="ghost" onClick={() => setIsDriverModalOpen(false)}>Cancelar</Button>
                            <Button className="!rounded-full" variant="primary">Guardar Chofer</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}