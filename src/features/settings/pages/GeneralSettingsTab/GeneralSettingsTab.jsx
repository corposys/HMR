import { useState, useEffect, useCallback } from 'react';
import { Globe, Building2, UploadCloud } from 'lucide-react';
import { SettingsSection } from '@features/settings/components/settings/SettingsSection';
import { SettingsField } from '@features/settings/components/settings/SettingsField';
import { SettingsGroup } from '@features/settings/components/settings/SettingsGroup';
import SettingsSaveBar from '@features/settings/components/settings/SettingsSaveBar';
import CustomDropdown from '@shared/common/CustomDropdown';
import { apiJson } from '@utils/api';
import { useToast } from '@context/ToastContext';
import { usePermissions } from '@hooks/usePermissions';

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

const EMPTY_FORM = {
    hotel_name: '',
    hotel_category: '',
    hotel_slogan: '',
    hotel_rif: '',
    hotel_address: '',
    hotel_phone: '',
    hotel_email: '',
    hotel_timezone: '',
    hotel_website: '',
};

export default function GeneralSettingsTab() {
    const { showToast } = useToast();
    const { can } = usePermissions();
    const [form, setForm] = useState(EMPTY_FORM);
    const [saved, setSaved] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiJson('/api/settings?category=hotel');
            const items = data.settings || [];
            const map = {};
            items.forEach((s) => { map[s.key] = s.value; });
            const normalized = {
                hotel_name: map.hotel_name || '',
                hotel_category: map.hotel_category || '',
                hotel_slogan: map.hotel_slogan || '',
                hotel_rif: map.hotel_rif || '',
                hotel_address: map.hotel_address || '',
                hotel_phone: map.hotel_phone || '',
                hotel_email: map.hotel_email || '',
                hotel_timezone: map.hotel_timezone || '',
                hotel_website: map.hotel_website || '',
            };
            setForm(normalized);
            setSaved(normalized);
        } catch {
            showToast({ title: 'Error', message: 'No se pudieron cargar los datos', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const isDirty = JSON.stringify(form) !== JSON.stringify(saved);
    const isReadOnly = !can('settings', 'write');

    const handleField = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
    const handleSelect = (key) => (val) => setForm((p) => ({ ...p, [key]: val }));

    const handleSave = async () => {
        if (isReadOnly || saving) return;
        setSaving(true);
        try {
            await apiJson('/api/settings/batch', {
                method: 'PUT',
                body: Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v])),
            });
            setSaved(form);
            showToast({ title: 'Guardado', message: 'Configuración general guardada', type: 'success' });
        } catch {
            showToast({ title: 'Error', message: 'No se pudo guardar', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDiscard = () => setForm(saved);

    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = () => setIsDragging(false);
    const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-48">
                <div className="animate-pulse text-[var(--color-text-muted)]">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 pb-24">
            <SettingsSection
                title="Identidad del Hotel"
                description="Datos públicos de tu establecimiento"
                icon={Globe}
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Logotipo
                        </label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl h-40 flex flex-col items-center justify-center gap-2 p-4 text-center transition-colors cursor-pointer ${
                                isDragging
                                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg-tertiary)]'
                            }`}
                        >
                            <UploadCloud className="w-6 h-6 text-[var(--color-text-muted)]" />
                            <p className="text-xs text-[var(--color-text-muted)]">PNG, JPG o SVG (máx. 2MB)</p>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <SettingsField label="Nombre Comercial">
                            <input
                                className="input w-full"
                                value={form.hotel_name}
                                onChange={handleField('hotel_name')}
                                placeholder="Nombre de tu hotel"
                                disabled={isReadOnly}
                            />
                        </SettingsField>
                        <SettingsField label="Categoría">
                            <CustomDropdown
                                value={form.hotel_category}
                                onChange={handleSelect('hotel_category')}
                                options={CATEGORY_OPTIONS}
                                placeholder="Seleccionar categoría"
                                disabled={isReadOnly}
                            />
                        </SettingsField>
                        <SettingsField label="Eslogan">
                            <input
                                className="input w-full"
                                value={form.hotel_slogan}
                                onChange={handleField('hotel_slogan')}
                                placeholder="Frase que define tu marca"
                                disabled={isReadOnly}
                            />
                        </SettingsField>
                    </div>
                </div>
            </SettingsSection>

            <SettingsSection
                title="Datos Fiscales y Contacto"
                description="Información legal y canales de comunicación"
                icon={Building2}
            >
                <SettingsGroup>
                    <SettingsField label="RIF">
                        <input
                            className="input w-full"
                            value={form.hotel_rif}
                            onChange={handleField('hotel_rif')}
                            placeholder="J-00000000-0"
                            disabled={isReadOnly}
                        />
                    </SettingsField>
                    <SettingsField label="Teléfono">
                        <input
                            className="input w-full"
                            value={form.hotel_phone}
                            onChange={handleField('hotel_phone')}
                            placeholder="+58 (281) 555-0199"
                            disabled={isReadOnly}
                        />
                    </SettingsField>
                    <SettingsField label="Correo">
                        <input
                            className="input w-full"
                            type="email"
                            value={form.hotel_email}
                            onChange={handleField('hotel_email')}
                            placeholder="contacto@tu-hotel.com"
                            disabled={isReadOnly}
                        />
                    </SettingsField>
                    <SettingsField label="Sitio Web">
                        <input
                            className="input w-full"
                            value={form.hotel_website}
                            onChange={handleField('hotel_website')}
                            placeholder="https://tu-hotel.com"
                            disabled={isReadOnly}
                        />
                    </SettingsField>
                    <SettingsField label="Zona Horaria" className="sm:col-span-2">
                        <CustomDropdown
                            value={form.hotel_timezone}
                            onChange={handleSelect('hotel_timezone')}
                            options={TIMEZONE_OPTIONS}
                            placeholder="Seleccionar zona horaria"
                            disabled={isReadOnly}
                        />
                    </SettingsField>
                    <SettingsField label="Dirección Fiscal" className="sm:col-span-2">
                        <textarea
                            rows="3"
                            className="input w-full resize-none"
                            value={form.hotel_address}
                            onChange={handleField('hotel_address')}
                            placeholder="Dirección fiscal completa"
                            disabled={isReadOnly}
                        />
                    </SettingsField>
                </SettingsGroup>
            </SettingsSection>

            <SettingsSaveBar
                isDirty={isDirty}
                isSaving={saving}
                onSave={handleSave}
                onDiscard={handleDiscard}
            />
        </div>
    );
}