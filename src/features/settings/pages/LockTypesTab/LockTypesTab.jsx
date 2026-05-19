import { useState, useEffect, useCallback } from 'react';
import { Plus, Wrench, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui/dialog';
import { SettingsSection } from '@features/settings/components/settings/SettingsSection';
import { SettingsField } from '@features/settings/components/settings/SettingsField';
import { apiJson } from '@utils/api';
import { useToast } from '@context/ToastContext';
import { usePermissions } from '@hooks/usePermissions';

const PART_CATEGORIES = [
    { value: 'lock', label: 'Cerradura' },
    { value: 'battery', label: 'Batería' },
    { value: 'reader', label: 'Lector' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'other', label: 'Otro' },
];

export default function LockTypesTab() {
    const { showToast } = useToast();
    const { can } = usePermissions();
    const [partTypes, setPartTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingPart, setEditingPart] = useState(null);
    const [formData, setFormData] = useState({ name: '', category: 'lock' });
    const [saving, setSaving] = useState(false);

    const fetchPartTypes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiJson('/api/maintenance/part-types');
            setPartTypes(data.part_types || []);
        } catch {
            showToast({ title: 'Error', message: 'No se pudieron cargar los tipos de piezas', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchPartTypes(); }, [fetchPartTypes]);

    const isReadOnly = !can('maintenance', 'write');

    const openCreate = () => {
        setEditingPart(null);
        setFormData({ name: '', category: 'lock' });
        setShowDialog(true);
    };

    const openEdit = (part) => {
        setEditingPart(part);
        setFormData({ name: part.name, category: part.category });
        setShowDialog(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            showToast({ title: 'Campo requerido', message: 'El nombre es obligatorio', type: 'error' });
            return;
        }
        setSaving(true);
        try {
            if (editingPart) {
                await apiJson(`/api/maintenance/part-types/${editingPart.id}`, {
                    method: 'PUT',
                    body: formData,
                });
                showToast({ title: 'Actualizado', message: 'Tipo de pieza actualizado', type: 'success' });
            } else {
                await apiJson('/api/maintenance/part-types', {
                    method: 'POST',
                    body: formData,
                });
                showToast({ title: 'Creado', message: 'Tipo de pieza creado', type: 'success' });
            }
            await fetchPartTypes();
            setShowDialog(false);
        } catch (err) {
            showToast({ title: 'Error', message: err.message || 'No se pudo guardar', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (part) => {
        if (!window.confirm(`¿Desactivar "${part.name}"?`)) return;
        try {
            await apiJson(`/api/maintenance/part-types/${part.id}`, { method: 'DELETE' });
            await fetchPartTypes();
            showToast({ title: 'Desactivado', message: `"${part.name}" desactivado`, type: 'success' });
        } catch (err) {
            showToast({ title: 'Error', message: err.message || 'No se pudo eliminar', type: 'error' });
        }
    };

    const getCategoryLabel = (val) => PART_CATEGORIES.find((c) => c.value === val)?.label || val;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-[var(--color-text-secondary)]">Gestión de componentes para cerraduras</p>
                </div>
                <Button onClick={openCreate} disabled={isReadOnly} className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90">
                    <Plus className="w-4 h-4" />
                    Nuevo Tipo
                </Button>
            </div>

            <SettingsSection title="Tipos de Piezas" description={`${partTypes.length} tipos registrados`} icon={Wrench}>
                {loading ? (
                    <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">Cargando...</div>
                ) : partTypes.length === 0 ? (
                    <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">No hay tipos de repuestos definidos</div>
                ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                        {partTypes.map((part) => (
                            <div key={part.id} className="flex items-center justify-between py-3 px-1 hover:bg-[var(--color-bg-tertiary)]/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-[var(--color-text-primary)]">{part.name}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant="info" className="text-[10px] px-1.5 py-0.5">{getCategoryLabel(part.category)}</Badge>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${part.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {part.is_active ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => openEdit(part)} disabled={isReadOnly} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-40" title="Editar">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDelete(part)} disabled={isReadOnly} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors disabled:opacity-40" title={part.is_active ? 'Desactivar' : 'Activar'}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SettingsSection>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPart ? 'Editar Tipo de Pieza' : 'Nuevo Tipo de Pieza'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <SettingsField label="Nombre">
                            <input
                                className="input w-full"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ej: Batería CR123"
                                autoFocus
                            />
                        </SettingsField>
                        <SettingsField label="Categoría">
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="input w-full"
                            >
                                {PART_CATEGORIES.map((cat) => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                ))}
                            </select>
                        </SettingsField>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSave} loading={saving} disabled={saving} className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90">Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}