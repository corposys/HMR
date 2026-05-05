import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit, RefreshCw, Users } from 'lucide-react';
import Button from '@shared/common/Button';
import Card from '@shared/common/Card';
import DataTable from '@shared/common/DataTable';
import Modal from '@shared/common/Modal';
import Input from '@shared/common/Input';
import { useOccupancyConfigs } from '@hooks/useOccupancyConfigs';
import { usePermissions } from '@hooks/usePermissions';

export default function OccupancyConfigManager() {
    const { items, loading, fetchConfigs, createConfig, updateConfig, deleteConfig } = useOccupancyConfigs();
    const { can } = usePermissions();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setFormError(null);
        const fd = new FormData(e.target);
        const payload = {
            code: fd.get('code'),
            label: fd.get('label'),
            min_pax: parseInt(fd.get('min_pax')),
            max_pax: parseInt(fd.get('max_pax')),
            sort_order: parseInt(fd.get('sort_order') || '0'),
            is_active: fd.get('is_active') === 'on',
        };

        try {
            if (editing) {
                await updateConfig(editing.id, payload);
            } else {
                await createConfig(payload);
            }
            setShowModal(false);
            setEditing(null);
        } catch (err) {
            setFormError(err.message);
        }
    }, [editing, createConfig, updateConfig]);

    const handleDelete = useCallback(async (id) => {
        if (!confirm('¿Eliminar esta configuración de ocupación?')) return;
        try {
            await deleteConfig(id);
        } catch (err) {
            alert(err.message);
        }
    }, [deleteConfig]);

    const columns = [
        {
            key: 'code',
            header: 'Código',
            render: (row) => <span className="font-mono text-sm">{row.code}</span>,
        },
        {
            key: 'label',
            header: 'Nombre',
            render: (row) => <span className="font-medium">{row.label}</span>,
        },
        {
            key: 'pax',
            header: 'Pax',
            render: (row) => (
                <span className="text-sm text-[var(--color-text-secondary)]">
                    {row.min_pax === row.max_pax ? row.min_pax : `${row.min_pax}-${row.max_pax}`}
                </span>
            ),
        },
        {
            key: 'sort_order',
            header: 'Orden',
            render: (row) => <span className="text-sm">{row.sort_order}</span>,
        },
        {
            key: 'status',
            header: 'Estado',
            render: (row) => (
                <span className={`text-xs ${row.is_active ? 'text-emerald-400' : 'text-[var(--color-text-muted)]'}`}>
                    {row.is_active ? 'Activa' : 'Inactiva'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: '',
            render: (row) => (
                <div className="flex items-center gap-1">
                    {can('settings', 'write') && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={Edit}
                                onClick={(e) => { e.stopPropagation(); setEditing(row); setShowModal(true); }}
                                title="Editar"
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={Trash2}
                                onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
                                title="Eliminar"
                            />
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Configuración de Ocupación</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">Define los tipos de ocupación y sus rangos de huéspedes</p>
                </div>
                {can('settings', 'write') && (
                    <Button icon={Plus} onClick={() => { setEditing(null); setShowModal(true); }}>
                        Nueva Configuración
                    </Button>
                )}
            </div>

            <Card>
                <DataTable
                    columns={columns}
                    data={items}
                    loading={loading}
                    emptyText="No hay configuraciones de ocupación"
                />
            </Card>

            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={() => { setShowModal(false); setEditing(null); setFormError(null); }}
                    title={editing ? 'Editar Configuración' : 'Nueva Configuración'}
                    icon={Users}
                    footer={(
                        <>
                            <Button variant="ghost" onClick={() => { setShowModal(false); setEditing(null); }}>Cancelar</Button>
                            <Button type="submit" form="config-form">{editing ? 'Guardar' : 'Crear'}</Button>
                        </>
                    )}
                >
                    <form id="config-form" onSubmit={handleSubmit} className="space-y-4">
                        {formError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
                                {formError}
                            </div>
                        )}
                        <Input
                            name="code"
                            label="Código"
                            defaultValue={editing?.code || ''}
                            required
                            disabled={!!editing}
                        />
                        <Input
                            name="label"
                            label="Nombre"
                            defaultValue={editing?.label || ''}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                name="min_pax"
                                label="Mín. Pax"
                                type="number"
                                min="1"
                                defaultValue={editing?.min_pax || 1}
                                required
                            />
                            <Input
                                name="max_pax"
                                label="Máx. Pax"
                                type="number"
                                min="1"
                                defaultValue={editing?.max_pax || 1}
                                required
                            />
                        </div>
                        <Input
                            name="sort_order"
                            label="Orden"
                            type="number"
                            defaultValue={editing?.sort_order || 0}
                        />
                        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                            <input
                                name="is_active"
                                type="checkbox"
                                defaultChecked={editing ? editing.is_active : true}
                                className="rounded border-[var(--color-border)]"
                            />
                            Activa
                        </label>
                    </form>
                </Modal>
            )}
        </div>
    );
}
