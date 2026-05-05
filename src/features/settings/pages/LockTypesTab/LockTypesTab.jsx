import { useState, useEffect, useCallback } from 'react';
import { Plus, Wrench, Pencil, Trash2, X } from 'lucide-react';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';
import Input from '@shared/common/Input';
import Modal from '@shared/common/Modal';
import DataTable from '@shared/common/DataTable';
import { apiFetch } from '@utils/api';

const PART_CATEGORIES = [
    { value: 'lock', label: 'Cerradura' },
    { value: 'battery', label: 'Batería' },
    { value: 'reader', label: 'Lector' },
    { value: 'card', label: 'Tarjeta' },
    { value: 'other', label: 'Otro' },
];

export default function LockTypesTab() {
    const [partTypes, setPartTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPart, setEditingPart] = useState(null);
    const [formData, setFormData] = useState({ name: '', category: 'lock' });
    const [saving, setSaving] = useState(false);

    const fetchPartTypes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiFetch('/api/maintenance/part-types');
            setPartTypes(data.part_types || []);
        } catch (err) {
            console.error('Error fetching part types:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPartTypes();
    }, [fetchPartTypes]);

    const openCreate = () => {
        setEditingPart(null);
        setFormData({ name: '', category: 'lock' });
        setShowModal(true);
    };

    const openEdit = (part) => {
        setEditingPart(part);
        setFormData({ name: part.name, category: part.category });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;
        setSaving(true);
        try {
            if (editingPart) {
                await apiFetch(`/api/maintenance/part-types/${editingPart.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
            } else {
                await apiFetch('/api/maintenance/part-types', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });
            }
            await fetchPartTypes();
            setShowModal(false);
        } catch (err) {
            console.error('Error saving part type:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (part) => {
        if (!window.confirm(`¿Desactivar "${part.name}"?`)) return;
        try {
            await apiFetch(`/api/maintenance/part-types/${part.id}`, {
                method: 'DELETE',
            });
            await fetchPartTypes();
        } catch (err) {
            console.error('Error deleting part type:', err);
        }
    };

    const columns = [
        {
            key: 'name',
            header: 'Nombre',
            render: (part) => <span className="font-medium">{part.name}</span>,
        },
        {
            key: 'category',
            header: 'Categoría',
            render: (part) => {
                const cat = PART_CATEGORIES.find(c => c.value === part.category);
                return <Badge variant="info">{cat?.label || part.category}</Badge>;
            },
        },
        {
            key: 'is_active',
            header: 'Estado',
            render: (part) => (
                <Badge variant={part.is_active ? 'success' : 'danger'}>
                    {part.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: '',
            render: (part) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => openEdit(part)}
                        className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded"
                        title="Editar"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleDelete(part)}
                        className="p-1 hover:bg-[var(--color-danger)]/10 rounded text-[var(--color-danger)]"
                        title={part.is_active ? 'Desactivar' : 'Activar'}
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Configuración de Cerraduras</h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        Gestión de tipos de componentes para cerraduras
                    </p>
                </div>
                <Button onClick={openCreate} icon={Plus}>
                    Nuevo Tipo
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={partTypes}
                loading={loading}
                emptyText="No hay tipos de repuestos definidos"
            />

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingPart ? 'Editar Tipo' : 'Nuevo Tipo'}
                footer={
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setShowModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} loading={saving}>
                            Guardar
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Nombre"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Batería CR123"
                    />
                    <div>
                        <label className="block text-sm font-medium mb-1">Categoría</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="input w-full"
                        >
                            {PART_CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
