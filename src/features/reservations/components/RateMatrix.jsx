import { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, RefreshCw, Percent, AlertTriangle } from 'lucide-react';
import Button from '@shared/common/Button';
import Card from '@shared/common/Card';
import CustomDropdown from '@shared/common/CustomDropdown';
import Input from '@shared/common/Input';
import Modal from '@shared/common/Modal';
import { useRates } from '@hooks/useRates';
import { useSeasons } from '@hooks/useSeasons';
import { useOccupancyConfigs } from '@hooks/useOccupancyConfigs';
import { usePermissions } from '@hooks/usePermissions';
import { apiFetch } from '@utils/api';

export default function RateMatrix() {
    const { items: rates, loading, fetchRates, batchUpdate, applyMultiplier } = useRates();
    const { items: seasons, fetchSeasons } = useSeasons();
    const { items: occupancyConfigs, fetchConfigs } = useOccupancyConfigs();
    const { can } = usePermissions();
    const [roomTypes, setRoomTypes] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState('');
    const [selectedRoomType, setSelectedRoomType] = useState('');
    const [editedRates, setEditedRates] = useState({});
    const [saving, setSaving] = useState(false);
    const [showMultiplierModal, setShowMultiplierModal] = useState(false);
    const [multiplierValue, setMultiplierValue] = useState('1.10');

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
            const params = { season_id: selectedSeason };
            if (selectedRoomType) params.room_type_id = selectedRoomType;
            fetchRates(params);
            setEditedRates({});
        }
    }, [selectedSeason, selectedRoomType, fetchRates]);

    const filteredRates = useMemo(() => {
        return rates;
    }, [rates]);

    const seasonOptions = useMemo(() => [
        { value: '', label: 'Todas las temporadas' },
        ...seasons.map((s) => ({ value: String(s.id), label: `${s.name} (${s.year})` })),
    ], [seasons]);

    const roomTypeOptions = useMemo(() => [
        { value: '', label: 'Todos los tipos' },
        ...roomTypes.map((rt) => ({ value: String(rt.id), label: rt.name })),
    ], [roomTypes]);

    const occupancyCodes = useMemo(() =>
        occupancyConfigs.filter((c) => c.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [occupancyConfigs]);

    const matrix = useMemo(() => {
        const m = {};
        roomTypes.forEach((rt) => {
            m[rt.id] = {};
            occupancyCodes.forEach((oc) => {
                const rate = filteredRates.find(
                    (r) => r.room_type_id === rt.id && r.occupancy_code === oc.code
                );
                m[rt.id][oc.code] = rate ? rate.nightly_rate_usd : (rt.default_rate_usd || 0);
            });
        });
        return m;
    }, [roomTypes, occupancyCodes, filteredRates]);

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
            await applyMultiplier(parseInt(selectedSeason), mult, selectedRoomType ? parseInt(selectedRoomType) : null);
            setShowMultiplierModal(false);
        } catch (err) {
            alert(err.message);
        }
    }, [selectedSeason, selectedRoomType, multiplierValue, applyMultiplier]);

    const displayedRoomTypes = selectedRoomType
        ? roomTypes.filter((rt) => String(rt.id) === selectedRoomType)
        : roomTypes;

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Matriz de Tarifas</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">Tarifas nocturnas por temporada, tipo de habitación y ocupación</p>
                </div>
                {can('settings', 'write') && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" icon={Percent} onClick={() => setShowMultiplierModal(true)}>
                            Aplicar Multiplicador
                        </Button>
                        <Button icon={Save} onClick={handleSave} loading={saving} disabled={Object.keys(editedRates).length === 0}>
                            Guardar Cambios
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <CustomDropdown
                    value={selectedSeason}
                    onChange={setSelectedSeason}
                    options={seasonOptions}
                    placeholder="Seleccionar temporada"
                    className="sm:w-72"
                />
                <CustomDropdown
                    value={selectedRoomType}
                    onChange={setSelectedRoomType}
                    options={roomTypeOptions}
                    placeholder="Tipo de habitación"
                    className="sm:w-64"
                />
            </div>

            <Card>
                {!selectedSeason ? (
                    <div className="text-center py-12 text-sm text-[var(--color-text-muted)]">
                        Selecciona una temporada para ver la matriz de tarifas
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Tipo de Habitación</th>
                                    {occupancyCodes.map((oc) => (
                                        <th key={oc.code} className="text-center">
                                            {oc.label}
                                            <div className="text-xs font-normal text-[var(--color-text-muted)]">{oc.min_pax}-{oc.max_pax} pax</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody key={`matrix-${selectedSeason}-${selectedRoomType}`}>
                                {displayedRoomTypes.map((rt) => (
                                    <tr key={rt.id}>
                                        <td className="font-medium whitespace-nowrap">{rt.name}</td>
                                        {occupancyCodes.map((oc) => {
                                            const key = `${rt.id}-${oc.code}`;
                                            const rate = matrix[rt.id]?.[oc.code] || 0;
                                            const edited = editedRates[key];
                                            return (
                                                <td key={oc.code} className="text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        defaultValue={rate}
                                                        onChange={(e) => handleCellChange(rt.id, oc.code, e.target.value)}
                                                        disabled={!can('settings', 'write')}
                                                        className={`input w-28 text-center text-sm ${edited ? 'border-[var(--color-primary)]' : ''}`}
                                                    />
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

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
                            Multiplica todas las tarifas de la temporada seleccionada por el factor indicado.
                        </p>
                        <Input
                            label="Multiplicador"
                            type="number"
                            step="0.01"
                            value={multiplierValue}
                            onChange={(e) => setMultiplierValue(e.target.value)}
                            placeholder="1.10"
                        />
                        <div className="text-xs text-[var(--color-text-muted)]">
                            Ejemplo: 1.10 = aumento del 10%, 0.90 = descuento del 10%
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
