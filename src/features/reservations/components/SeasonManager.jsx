import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Copy, Trash2, Edit, Calendar, AlertTriangle } from 'lucide-react';
import Button from '@shared/common/Button';
import Card from '@shared/common/Card';
import DataTable from '@shared/common/DataTable';
import Modal from '@shared/common/Modal';
import Input from '@shared/common/Input';
import CustomDropdown from '@shared/common/CustomDropdown';
import { useSeasons } from '@hooks/useSeasons';
import { usePermissions } from '@hooks/usePermissions';

const SEASON_TYPE_OPTIONS = [
    { value: 'low', label: 'Baja' },
    { value: 'high', label: 'Alta' },
    { value: 'shoulder', label: 'Intermedia' },
    { value: 'special', label: 'Especial' },
];

const SEASON_TYPE_LABELS = {
    low: 'Baja',
    high: 'Alta',
    shoulder: 'Intermedia',
    special: 'Especial',
};

const SEASON_TYPE_BADGE = {
    low: 'bg-emerald-500/10 text-emerald-400',
    high: 'bg-rose-500/10 text-rose-400',
    shoulder: 'bg-amber-500/10 text-amber-400',
    special: 'bg-purple-500/10 text-purple-400',
};

export default function SeasonManager() {
    const { items, loading, fetchSeasons, createSeason, updateSeason, deleteSeason, cloneSeason } = useSeasons();
    const { can } = usePermissions();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formError, setFormError] = useState(null);
    const [formType, setFormType] = useState('low');
    const [cloneYear, setCloneYear] = useState('');
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [cloneTarget, setCloneTarget] = useState(null);

    useEffect(() => {
        fetchSeasons();
    }, [fetchSeasons]);

    const openModal = useCallback((row) => {
        setEditing(row);
        setFormType(row?.type || 'low');
        setFormError(null);
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditing(null);
        setFormError(null);
        setFormType('low');
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setFormError(null);
        const fd = new FormData(e.target);
        const payload = {
            name: fd.get('name'),
            type: formType,
            start_date: fd.get('start_date'),
            end_date: fd.get('end_date'),
            year: parseInt(fd.get('year')),
            is_active: fd.get('is_active') === 'on',
        };

        try {
            if (editing) {
                await updateSeason(editing.id, payload);
            } else {
                await createSeason(payload);
            }
            setShowModal(false);
            setEditing(null);
        } catch (err) {
            setFormError(err.message);
        }
    }, [editing, formType, createSeason, updateSeason]);

    const handleDelete = useCallback(async (id) => {
        if (!confirm('¿Eliminar esta temporada? Se eliminarán también sus tarifas.')) return;
        try {
            await deleteSeason(id);
        } catch (err) {
            alert(err.message);
        }
    }, [deleteSeason]);

    const handleClone = useCallback(async () => {
        if (!cloneYear || !cloneTarget) return;
        try {
            await cloneSeason(cloneTarget.id, parseInt(cloneYear));
            setShowCloneModal(false);
            setCloneTarget(null);
            setCloneYear('');
        } catch (err) {
            alert(err.message);
        }
    }, [cloneSeason, cloneYear, cloneTarget]);

    const columns = [
        {
            key: 'name',
            header: 'Nombre',
            render: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
            key: 'type',
            header: 'Tipo',
            render: (row) => (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${SEASON_TYPE_BADGE[row.type] || ''}`}>
                    {SEASON_TYPE_LABELS[row.type] || row.type}
                </span>
            ),
        },
        {
            key: 'dates',
            header: 'Fechas',
            render: (row) => (
                <div className="text-sm text-[var(--color-text-secondary)]">
                    {row.start_date} → {row.end_date}
                </div>
            ),
        },
        {
            key: 'year',
            header: 'Año',
            render: (row) => <span className="text-sm">{row.year}</span>,
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
                                icon={Copy}
                                onClick={(e) => { e.stopPropagation(); setCloneTarget(row); setShowCloneModal(true); }}
                                title="Clonar"
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={Edit}
                                onClick={(e) => { e.stopPropagation(); openModal(row); }}
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
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Temporadas</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">Gestión de temporadas y tarifas por época del año</p>
                </div>
                {can('settings', 'write') && (
                    <Button icon={Plus} onClick={() => openModal(null)}>
                        Nueva Temporada
                    </Button>
                )}
            </div>

            <Card>
                <DataTable
                    columns={columns}
                    data={items}
                    loading={loading}
                    emptyText="No hay temporadas configuradas"
                />
            </Card>

            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={closeModal}
                    title={editing ? 'Editar Temporada' : 'Nueva Temporada'}
                    icon={Calendar}
                    footer={(
                        <>
                            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit" form="season-form">{editing ? 'Guardar' : 'Crear'}</Button>
                        </>
                    )}
                >
                    <form id="season-form" onSubmit={handleSubmit} className="space-y-4">
                        {formError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                {formError}
                            </div>
                        )}
                        <Input
                            name="name"
                            label="Nombre"
                            defaultValue={editing?.name || ''}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Tipo</label>
                            <CustomDropdown
                                value={formType}
                                onChange={setFormType}
                                options={SEASON_TYPE_OPTIONS}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                name="start_date"
                                label="Fecha inicio"
                                type="date"
                                defaultValue={editing?.start_date || ''}
                                required
                            />
                            <Input
                                name="end_date"
                                label="Fecha fin"
                                type="date"
                                defaultValue={editing?.end_date || ''}
                                required
                            />
                        </div>
                        <Input
                            name="year"
                            label="Año"
                            type="number"
                            defaultValue={editing?.year || new Date().getFullYear()}
                            required
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

            {showCloneModal && cloneTarget && (
                <Modal
                    isOpen={showCloneModal}
                    onClose={() => { setShowCloneModal(false); setCloneTarget(null); setCloneYear(''); }}
                    title={`Clonar: ${cloneTarget.name}`}
                    icon={Copy}
                    footer={(
                        <>
                            <Button variant="ghost" onClick={() => { setShowCloneModal(false); setCloneTarget(null); }}>Cancelar</Button>
                            <Button onClick={handleClone} disabled={!cloneYear}>Clonar</Button>
                        </>
                    )}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Se creará una copia de <strong>{cloneTarget.name}</strong> con sus tarifas y tarifas de niños para el año indicado.
                        </p>
                        <Input
                            label="Año destino"
                            type="number"
                            value={cloneYear}
                            onChange={(e) => setCloneYear(e.target.value)}
                            placeholder={new Date().getFullYear() + 1}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}
