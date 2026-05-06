import { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, RefreshCw, Percent, Users, Plus, AlertTriangle } from 'lucide-react';
import Button from '@shared/common/Button';
import CustomDropdown from '@shared/common/CustomDropdown';
import Input from '@shared/common/Input';
import Modal from '@shared/common/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRates } from '@hooks/useRates';
import { useSeasons } from '@hooks/useSeasons';
import { useOccupancyConfigs } from '@hooks/useOccupancyConfigs';
import { usePermissions } from '@hooks/usePermissions';
import { apiFetch } from '@utils/api';

export default function RateMatrix() {
    const { items: rates, loading, fetchRates, batchUpdate, applyMultiplier } = useRates();
    const { items: seasons, fetchSeasons } = useSeasons();
    const { items: occupancyConfigs, fetchConfigs, updateConfig, createConfig } = useOccupancyConfigs();
    const { can } = usePermissions();
    
    const [roomTypes, setRoomTypes] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState('');
    const [editedRates, setEditedRates] = useState({});
    const [saving, setSaving] = useState(false);
    
    const [showMultiplierModal, setShowMultiplierModal] = useState(false);
    const [multiplierValue, setMultiplierValue] = useState('1.10');
    
    // Occupancy modal
    const [showOccModal, setShowOccModal] = useState(false);
    const [occEditing, setOccEditing] = useState(null);
    const [occError, setOccError] = useState(null);

    useEffect(() => {
        fetchSeasons();
        fetchConfigs();
        async function loadRoomTypes() {
            try {
                const data = await apiFetch('/api/settings/room-types');
                setRoomTypes(data.room_types || []);
            } catch (err) {
                console.error(err);
            }
        }
        loadRoomTypes();
    }, [fetchSeasons, fetchConfigs]);

    useEffect(() => {
        if (selectedSeason) {
            fetchRates({ season_id: selectedSeason });
            setEditedRates({});
        }
    }, [selectedSeason, fetchRates]);

    const seasonOptions = useMemo(() => [
        { value: '', label: 'Seleccionar Temporada' },
        ...seasons.map((s) => ({ value: String(s.id), label: `${s.name} (${s.year})` })),
    ], [seasons]);

    const activeOccupancyConfigs = useMemo(() =>
        occupancyConfigs.filter((c) => c.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [occupancyConfigs]);

    const matrix = useMemo(() => {
        const m = {};
        roomTypes.forEach((rt) => {
            m[rt.id] = {};
            activeOccupancyConfigs.forEach((oc) => {
                const rate = rates.find(
                    (r) => r.room_type_id === rt.id && r.occupancy_code === oc.code
                );
                m[rt.id][oc.code] = rate ? rate.nightly_rate_usd : (rt.default_rate_usd || 0);
            });
        });
        return m;
    }, [roomTypes, activeOccupancyConfigs, rates]);

    const handleCellChange = useCallback((roomTypeId, occupancyCode, value) => {
        setEditedRates((prev) => ({
            ...prev,
            [`${roomTypeId}-${occupancyCode}`]: {
                room_type_id: roomTypeId,
                occupancy_code: occupancyCode,
                nightly_rate_usd: parseFloat(value) || 0,
            },
        }));
    }, []);

    const handleSave = useCallback(async () => {
        if (!selectedSeason) return;
        setSaving(true);
        try {
            const updates = Object.values(editedRates).map((r) => ({
                season_id: parseInt(selectedSeason),
                room_type_id: r.room_type_id,
                occupancy_code: r.occupancy_code,
                nightly_rate_usd: r.nightly_rate_usd,
            }));
            await batchUpdate(updates);
            setEditedRates({});
        } catch (err) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    }, [editedRates, selectedSeason, batchUpdate]);

    const handleApplyMultiplier = useCallback(async () => {
        if (!selectedSeason) return;
        try {
            const mult = parseFloat(multiplierValue);
            // Apply to all room types (null room_type_id)
            await applyMultiplier(parseInt(selectedSeason), mult, null);
            setShowMultiplierModal(false);
        } catch (err) {
            alert(err.message);
        }
    }, [selectedSeason, multiplierValue, applyMultiplier]);

    const handleOccSubmit = async (e) => {
        e.preventDefault();
        setOccError(null);
        const fd = new FormData(e.target);
        const payload = {
            code: fd.get('code'),
            label: fd.get('label'),
            min_pax: parseInt(fd.get('min_pax')),
            max_pax: parseInt(fd.get('max_pax')),
            sort_order: parseInt(fd.get('sort_order') || '0'),
            is_active: true,
        };

        try {
            if (occEditing) {
                await updateConfig(occEditing.id, payload);
            } else {
                await createConfig(payload);
            }
            setShowOccModal(false);
            setOccEditing(null);
        } catch (err) {
            setOccError(err.message);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-sm">
                <div className="flex-1 max-w-sm">
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1 uppercase tracking-wider">Temporada</label>
                    <CustomDropdown
                        value={selectedSeason}
                        onChange={setSelectedSeason}
                        options={seasonOptions}
                        placeholder="Seleccionar temporada"
                        className="w-full"
                    />
                </div>
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                    {can('settings', 'write') && selectedSeason && (
                        <>
                            <Button variant="outline" icon={Percent} size="sm" onClick={() => setShowMultiplierModal(true)}>
                                Multiplicador
                            </Button>
                            <Button icon={Save} size="sm" onClick={handleSave} loading={saving} disabled={Object.keys(editedRates).length === 0}>
                                Guardar Tarifas
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {!selectedSeason ? (
                <div className="text-center py-16 px-4 bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text-muted)]">
                    Selecciona una temporada para comenzar a editar las tarifas.
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Configurador de Tipos de Ocupación */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Tipos de Ocupación</h3>
                            {can('settings', 'write') && (
                                <button onClick={() => { setOccEditing(null); setShowOccModal(true); }} className="text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 p-1">
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
                            <div className="divide-y divide-[var(--color-border)]">
                                {activeOccupancyConfigs.map(oc => (
                                    <div key={oc.id} className="p-3 flex items-center justify-between group hover:bg-[var(--color-bg-tertiary)] transition-colors">
                                        <div>
                                            <div className="text-sm font-medium text-[var(--color-text-primary)]">{oc.label}</div>
                                            <div className="text-xs text-[var(--color-text-muted)]">{oc.min_pax} a {oc.max_pax} personas</div>
                                        </div>
                                        {can('settings', 'write') && (
                                            <button 
                                                onClick={() => { setOccEditing(oc); setShowOccModal(true); }}
                                                className="text-xs px-2 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                            >
                                                Editar
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Matriz Principal con Tabla */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-sm overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Tipo de Habitación</TableHead>
                                        {activeOccupancyConfigs.map(oc => (
                                            <TableHead key={oc.code} className="text-center min-w-[140px]">
                                                <div title={oc.label} className="flex flex-col items-center">
                                                    <span>{oc.label}</span>
                                                    <span className="text-[10px] font-normal text-muted-foreground">{oc.min_pax}-{oc.max_pax}p</span>
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {roomTypes.map(rt => (
                                        <TableRow key={rt.id}>
                                            <TableCell className="font-medium bg-[var(--color-bg-tertiary)]/50">
                                                {rt.name}
                                                <div className="text-[10px] text-muted-foreground">Base: ${rt.default_rate_usd}</div>
                                            </TableCell>
                                            {activeOccupancyConfigs.map(oc => {
                                                const key = `${rt.id}-${oc.code}`;
                                                const rate = matrix[rt.id]?.[oc.code] || 0;
                                                const edited = editedRates[key];
                                                
                                                return (
                                                    <TableCell key={oc.code} className="p-2">
                                                        <div className="relative flex items-center justify-center">
                                                            <span className="absolute left-3 text-[var(--color-text-muted)] text-sm font-medium">$</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                defaultValue={rate}
                                                                onChange={(e) => handleCellChange(rt.id, oc.code, e.target.value)}
                                                                disabled={!can('settings', 'write')}
                                                                className={`w-[120px] pl-7 pr-3 py-1.5 text-sm bg-[var(--color-bg-primary)] border rounded-md focus:outline-none focus:ring-1 transition-colors ${edited ? 'border-[var(--color-primary)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]' : 'border-[var(--color-border)] focus:border-[var(--color-text-muted)] focus:ring-[var(--color-text-muted)]'}`}
                                                            />
                                                        </div>
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modales */}
            {showMultiplierModal && (
                <Modal
                    isOpen={showMultiplierModal}
                    onClose={() => setShowMultiplierModal(false)}
                    title="Aplicar Multiplicador"
                    icon={Percent}
                    footer={(
                        <>
                            <Button variant="ghost" onClick={() => setShowMultiplierModal(false)}>Cancelar</Button>
                            <Button onClick={handleApplyMultiplier}>Aplicar</Button>
                        </>
                    )}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Aplica un multiplicador masivo a todas las tarifas de la temporada seleccionada.
                        </p>
                        <Input
                            label="Multiplicador"
                            type="number"
                            step="0.01"
                            value={multiplierValue}
                            onChange={(e) => setMultiplierValue(e.target.value)}
                            placeholder="1.10"
                        />
                        <div className="bg-[var(--color-bg-tertiary)] p-3 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] space-y-1">
                            <p><strong>Ejemplos:</strong></p>
                            <ul className="list-disc list-inside pl-4 text-[var(--color-text-muted)]">
                                <li><strong>1.10</strong> = Aumento del 10%</li>
                                <li><strong>1.50</strong> = Aumento del 50%</li>
                                <li><strong>0.90</strong> = Descuento del 10%</li>
                            </ul>
                        </div>
                    </div>
                </Modal>
            )}
            
            {showOccModal && (
                <Modal
                    isOpen={showOccModal}
                    onClose={() => { setShowOccModal(false); setOccEditing(null); setOccError(null); }}
                    title={occEditing ? 'Editar Ocupación' : 'Nueva Ocupación'}
                    icon={Users}
                    footer={(
                        <>
                            <Button variant="ghost" onClick={() => { setShowOccModal(false); setOccEditing(null); }}>Cancelar</Button>
                            <Button type="submit" form="occ-form">{occEditing ? 'Guardar' : 'Crear'}</Button>
                        </>
                    )}
                >
                    <form id="occ-form" onSubmit={handleOccSubmit} className="space-y-4">
                        {occError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {occError}
                            </div>
                        )}
                        <Input
                            name="code"
                            label="Código (Ej. SGL, DBL, TPL, CHD)"
                            defaultValue={occEditing?.code || ''}
                            required
                            disabled={!!occEditing}
                        />
                        <Input
                            name="label"
                            label="Nombre (Ej. Sencilla, Doble, Niño)"
                            defaultValue={occEditing?.label || ''}
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                name="min_pax"
                                label="Mínimo de Personas"
                                type="number"
                                min="0"
                                defaultValue={occEditing?.min_pax || 1}
                                required
                            />
                            <Input
                                name="max_pax"
                                label="Máximo de Personas"
                                type="number"
                                min="1"
                                defaultValue={occEditing?.max_pax || 1}
                                required
                            />
                        </div>
                        <Input
                            name="sort_order"
                            label="Orden de visualización"
                            type="number"
                            defaultValue={occEditing?.sort_order || 0}
                        />
                    </form>
                </Modal>
            )}
        </div>
    );
}
