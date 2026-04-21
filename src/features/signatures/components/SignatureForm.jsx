import React from 'react';
import { User, Settings as SettingsIcon, Mail, Smartphone, PhoneCall, Globe, Eraser } from 'lucide-react';

export default function SignatureForm({ formData, setFormData, handleClear, fixedData }) {
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Validación específica para Nombre y Apellido
        if (name === 'fullName') {
            const regex = /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g;
            const sanitizedValue = value.replace(regex, '');
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        // Validación para Cargo/Departamento
        if (name === 'jobTitle') {
            const regex = /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-/\.,]/g;
            const sanitizedValue = value.replace(regex, '');
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        // Validación para Extensión Telefónica
        if (name === 'extension') {
            const regex = /[^0-9\-<>]/g;
            const sanitizedValue = value.replace(regex, '');
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        // Validación simple para correo electrónico
        if (name === 'email') {
            const regex = /[^a-zA-Z0-9@._-]/g;
            const sanitizedValue = value.replace(regex, '');
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="lg:col-span-1 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-sm p-6 overflow-y-auto">
            <div className="flex justify-between items-center pb-4">
                <h2 className="text-lg font-medium text-[var(--color-text-primary)] flex items-center gap-2 m-0">
                    <User className="w-7 h-7 text-[var(--color-primary)]" />
                    Datos del Usuario
                </h2>
                <button
                    onClick={handleClear}
                    className="flex items-center justify-center p-2 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-red-500 transition-colors border border-[var(--color-border)] hover:border-red-500/50"
                    title="Limpiar campos"
                >
                    <Eraser className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4">
                {/* Nombre y Apellido */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                        Nombre y Apellido
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                            placeholder="NOMBRE Y APELLIDO"
                            maxLength={18}
                        />
                    </div>
                </div>

                {/* Cargo */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                        Departamento / Cargo
                    </label>
                    <div className="relative">
                        <SettingsIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            name="jobTitle"
                            value={formData.jobTitle}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                            placeholder="CARGO / DEPARTAMENTO"
                            maxLength={18}
                        />
                    </div>
                </div>

                {/* Correo */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                        Correo Electrónico
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                            placeholder="CORREO ELECTRÓNICO"
                            maxLength={40}
                        />
                    </div>
                </div>

                {/* Celular (Editable) */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 flex justify-between items-center">
                        <span>Teléfono Móvil</span>
                        <span className="text-[var(--color-text-muted)] text-xs font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            name="mobilePhone"
                            value={formData.mobilePhone}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                            placeholder="+58 414-0000000"
                            maxLength={15}
                        />
                    </div>
                </div>

                {/* Extensión (Editable) */}
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                        Extensión Telefónica
                    </label>
                    <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            name="extension"
                            value={formData.extension}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                            placeholder="0000"
                            maxLength={10}
                        />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                        Teléfono Oficina
                    </label>
                    {/* Fixed Fields Preview */}
                    <div className="grid grid-cols-1 gap-3 mb-3">
                        <div className="p-3 bg-[var(--color-bg-tertiary)] bg-opacity-50 rounded-lg border border-[var(--color-border)] flex items-start gap-3">
                            <PhoneCall className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">{fixedData.officePhone}</p>
                            </div>
                        </div>
                    </div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                        Sitio Web
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="p-3 bg-[var(--color-bg-tertiary)] bg-opacity-50 rounded-lg border border-[var(--color-border)] flex items-start gap-3">
                            <Globe className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">{fixedData.website}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
