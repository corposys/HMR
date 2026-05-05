import React, { useEffect, useMemo, useState } from 'react';
import { Globe, Building2, UploadCloud, Save } from 'lucide-react';
import CustomDropdown from '@shared/common/CustomDropdown';
import Button from '@shared/common/Button';
import Input from '@shared/common/Input';

const STORAGE_KEY = 'hmr_general_profile';

const EMPTY_PROFILE = {
    commercialName: '',
    category: '',
    slogan: '',
    legalName: '',
    rif: '',
    fiscalAddress: '',
    receptionPhone: '',
    officialEmail: '',
    timezone: '',
    website: '',
};

const CATEGORY_OPTIONS = [
    { value: '5', label: '5 Estrellas' },
    { value: '4', label: '4 Estrellas' },
    { value: '3', label: '3 Estrellas' },
    { value: 'boutique', label: 'Hotel Boutique' },
    { value: 'resort', label: 'Resort' },
    { value: 'posada', label: 'Posada' },
];

const TIMEZONE_OPTIONS = [
    { value: 'America/Caracas', label: 'America/Caracas (GMT-4)' },
    { value: 'America/Bogota', label: 'America/Bogota (GMT-5)' },
    { value: 'America/New_York', label: 'America/New_York (GMT-5)' },
    { value: 'Europe/Madrid', label: 'Europe/Madrid (GMT+1)' },
];

function normalizeProfile(profile = {}) {
    return {
        commercialName: profile.commercialName ?? '',
        category: profile.category ?? '',
        slogan: profile.slogan ?? '',
        legalName: profile.legalName ?? '',
        rif: profile.rif ?? '',
        fiscalAddress: profile.fiscalAddress ?? '',
        receptionPhone: profile.receptionPhone ?? '',
        officialEmail: profile.officialEmail ?? '',
        timezone: profile.timezone ?? '',
        website: profile.website ?? '',
    };
}

export default function GeneralSettingsTab() {
    const [isDragging, setIsDragging] = useState(false);
    const [formData, setFormData] = useState(EMPTY_PROFILE);
    const [savedData, setSavedData] = useState(EMPTY_PROFILE);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    useEffect(() => {
        const storedProfile = localStorage.getItem(STORAGE_KEY);
        if (!storedProfile) {
            setFormData(EMPTY_PROFILE);
            setSavedData(EMPTY_PROFILE);
            return;
        }

        try {
            const parsed = JSON.parse(storedProfile);
            const normalized = normalizeProfile(parsed);
            setFormData(normalized);
            setSavedData(normalized);
        } catch {
            setFormData(EMPTY_PROFILE);
            setSavedData(EMPTY_PROFILE);
        }
    }, []);

    const hasChanges = useMemo(
        () => JSON.stringify(formData) !== JSON.stringify(savedData),
        [formData, savedData],
    );

    const handleFieldChange = (field) => (e) => {
        const value = e.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (saveStatus) {
            setSaveStatus(null);
        }
    };

    const handleSelectChange = (field) => (value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (saveStatus) {
            setSaveStatus(null);
        }
    };

    const handleSave = () => {
        if (!hasChanges || isSaving) {
            return;
        }

        setIsSaving(true);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
            setSavedData(formData);
            setSaveStatus('saved');
        } catch {
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                        Perfil Corporativo del Hotel
                    </h2>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    variant="register"
                    icon={Save}
                    className="active:scale-95"
                >
                    <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </Button>
            </div>

            {saveStatus === 'saved' && (
                <p className="text-sm text-[var(--color-success)]">Cambios guardados correctamente.</p>
            )}
            {saveStatus === 'error' && (
                <p className="text-sm text-[var(--color-danger)]">No se pudo guardar. Intenta nuevamente.</p>
            )}

            <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] overflow-visible shadow-sm">
                <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-3 bg-[var(--color-bg-tertiary)]/30">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                        <Globe size={20} />
                    </div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">
                        Identidad Visual
                    </h3>
                </div>
                
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                            Logotipo del Hotel
                        </label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                                border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center gap-3 p-4 text-center transition-colors cursor-pointer
                                ${isDragging 
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' 
                                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg-tertiary)]'
                                }
                            `}
                        >
                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-full">
                                <UploadCloud className="w-6 h-6 text-[var(--color-text-muted)]" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                    Haz clic o arrastra tu logo aquí
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    PNG, JPG o SVG (máx. 2MB)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-5">
                        <Input 
                            label="Nombre Comercial" 
                            value={formData.commercialName}
                            onChange={handleFieldChange('commercialName')}
                            placeholder="Ej. Grand Hotel Central"
                        />
                        
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-[var(--color-text-primary)]">
                                Categoría Oficial
                            </label>
                            <CustomDropdown
                                value={formData.category}
                                onChange={handleSelectChange('category')}
                                options={CATEGORY_OPTIONS}
                                placeholder="Seleccionar categoría"
                            />
                        </div>

                        <Input 
                            label="Eslogan Comercial" 
                            value={formData.slogan}
                            onChange={handleFieldChange('slogan')}
                            placeholder="Frase corta que define tu marca"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] overflow-visible shadow-sm">
                <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-3 bg-[var(--color-bg-tertiary)]/30">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
                        <Building2 size={20} />
                    </div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">
                        Datos Fiscales y Contacto
                    </h3>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input 
                        label="Razón Social (Empresa)" 
                        value={formData.legalName}
                        onChange={handleFieldChange('legalName')}
                        placeholder="Nombre legal completo"
                    />
                    
                    <Input 
                        label="Registro de Información Fiscal (RIF)" 
                        value={formData.rif}
                        onChange={handleFieldChange('rif')}
                        placeholder="Ej. J-00000000-0"
                    />

                    <div className="flex flex-col gap-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-[var(--color-text-primary)]">
                            Dirección Fiscal Completa
                        </label>
                        <textarea 
                            rows="3"
                            value={formData.fiscalAddress}
                            onChange={handleFieldChange('fiscalAddress')}
                            className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-sm rounded-lg px-3 py-2 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-all resize-none"
                            placeholder="Ingresa la dirección fiscal completa"
                        ></textarea>
                    </div>

                    <Input 
                        label="Teléfono de Recepción" 
                        value={formData.receptionPhone}
                        onChange={handleFieldChange('receptionPhone')}
                        type="tel"
                        placeholder="Ej. +58 (281) 555-0199"
                    />
                    
                    <Input 
                        label="Correo Electrónico Oficial" 
                        value={formData.officialEmail}
                        onChange={handleFieldChange('officialEmail')}
                        type="email"
                        placeholder="Ej. contacto@tu-hotel.com"
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-[var(--color-text-primary)]">
                            Zona Horaria Predeterminada
                        </label>
                        <CustomDropdown
                            value={formData.timezone}
                            onChange={handleSelectChange('timezone')}
                            options={TIMEZONE_OPTIONS}
                            placeholder="Seleccionar zona horaria"
                        />
                    </div>

                    <Input 
                        label="Sitio Web" 
                        value={formData.website}
                        onChange={handleFieldChange('website')}
                        placeholder="https://"
                    />
                </div>
            </div>

        </div>
    );
}
