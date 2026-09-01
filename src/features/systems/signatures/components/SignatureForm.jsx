import React from 'react';
import { ArrowLeft, User, Settings as SettingsIcon, Mail, Smartphone, PhoneCall, Globe, Eraser } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignatureForm({ formData, setFormData, handleClear, fixedData, readOnly = false }) {
    const handleInputChange = (e) => {
        if (readOnly) return;
        const { name, value } = e.target;

        if (name === 'fullName') {
            const regex = /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g;
            const sanitizedValue = value.replace(regex, '');
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        if (name === 'email') {
            const regex = /[^a-zA-Z0-9@._-]/g;
            const sanitizedValue = value.replace(regex, '');
            setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm h-fit">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2 m-0">
                        <User className="w-5 h-5 text-[var(--color-primary)]" />
                        Datos del Usuario
                    </CardTitle>
                    {!readOnly && (
                        <button
                            onClick={handleClear}
                            className="flex items-center justify-center p-2 rounded-lg bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-red-500 transition-colors border border-[var(--color-border)] hover:border-red-500/50"
                            title="Limpiar campos"
                        >
                            <Eraser className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Nombre y Apellido
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            readOnly={readOnly}
                            className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors disabled:opacity-60"
                            placeholder="NOMBRE Y APELLIDO"
                            maxLength={50}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Departamento / Cargo
                    </label>
                    <div className="relative">
                        <SettingsIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            name="jobTitle"
                            value={formData.jobTitle}
                            onChange={handleInputChange}
                            readOnly={readOnly}
                            className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors disabled:opacity-60"
                            placeholder="CARGO / DEPARTAMENTO"
                            maxLength={50}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Correo Electrónico
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            readOnly={readOnly}
                            className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors disabled:opacity-60"
                            placeholder="CORREO ELECTRÓNICO"
                            maxLength={60}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1 flex justify-between items-center">
                        <span>Teléfono Móvil</span>
                        <span className="text-[var(--color-text-muted)] text-[11px] font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            name="mobilePhone"
                            value={formData.mobilePhone}
                            onChange={handleInputChange}
                            readOnly={readOnly}
                            className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors disabled:opacity-60"
                            placeholder="+58 414-0000000"
                            maxLength={20}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Extensión Telefónica
                    </label>
                    <div className="relative">
                        <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            name="extension"
                            value={formData.extension}
                            onChange={handleInputChange}
                            readOnly={readOnly}
                            className="w-full pl-10 pr-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors disabled:opacity-60"
                            placeholder="0000"
                            maxLength={20}
                        />
                    </div>
                </div>

                <div className="pt-2 border-t border-[var(--color-border)]">
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Teléfono Oficina
                    </label>
                    <div className="p-3 bg-[var(--color-bg-tertiary)]/50 rounded-lg border border-[var(--color-border)] flex items-start gap-3">
                        <PhoneCall className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">{fixedData.officePhone}</p>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                        Sitio Web
                    </label>
                    <div className="p-3 bg-[var(--color-bg-tertiary)]/50 rounded-lg border border-[var(--color-border)] flex items-start gap-3">
                        <Globe className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">{fixedData.website}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
