import React, { useCallback, useEffect, useState } from 'react';
import { Building2, MapPin, Layers, BedDouble, Wrench, Plus, Check } from 'lucide-react';
import Button from '@shared/common/Button';
import StatCard from '@shared/common/StatCard';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import Alert from '@shared/common/Alert';
import { apiJson } from '@utils/api';
import { useToast } from '@context/ToastContext';
import { usePermissions } from '@hooks/usePermissions';
import { ModuleCard } from '@features/settings/components/structure/ModuleCard';

const getNextModuleNumber = (modules = []) => String(modules.reduce((max, m) => Math.max(max, Number(m.number) || 0), 0) + 1);

export default function StructureTab() {
    const [property, setProperty] = useState(null);
    const [roomTypes, setRoomTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creatingModule, setCreatingModule] = useState(false);
    const [savingStructure, setSavingStructure] = useState(false);
    const [pendingModuleUpdates, setPendingModuleUpdates] = useState({});
    const [editingModuleIds, setEditingModuleIds] = useState({});
    const { showToast } = useToast();
    const { isAdmin, can } = usePermissions();
    const canEditType = isAdmin || can('settings', 'write');

    const fetchTree = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [treeData, typesData] = await Promise.all([
                apiJson('/api/structure/tree'),
                apiJson('/api/settings/room-types'),
            ]);
            setProperty(treeData.property);
            setRoomTypes(typesData.room_types || []);
        } catch (fetchError) {
            setError(fetchError.message);
            showToast({ title: 'No se pudo cargar la estructura', message: fetchError.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchTree(); }, [fetchTree]);

    const refresh = () => fetchTree();

    const isModuleEditable = useCallback((moduleId) => Boolean(editingModuleIds[String(moduleId)]), [editingModuleIds]);

    const toggleModuleEditMode = useCallback((moduleId) => {
        setEditingModuleIds((current) => {
            const key = String(moduleId);
            if (current[key]) {
                const { [key]: _, ...rest } = current;
                return rest;
            }
            return { ...current, [key]: true };
        });
    }, []);

    const handleModuleDraftChange = useCallback((moduleId, payload) => {
        setPendingModuleUpdates((current) => {
            const key = String(moduleId);
            if (!payload) {
                if (!(key in current)) return current;
                const { [key]: _, ...rest } = current;
                return rest;
            }
            const existing = current[key];
            if (existing && existing.name === payload.name && existing.category === payload.category) return current;
            return { ...current, [key]: payload };
        });
    }, []);

    const handleGlobalSave = async () => {
        const entries = Object.entries(pendingModuleUpdates);
        if (entries.length === 0) {
            showToast({ title: 'Sin cambios pendientes', message: 'No hay elementos editables para guardar.', type: 'info' });
            return;
        }
        setSavingStructure(true);
        try {
            await Promise.all(entries.map(([moduleId, payload]) => apiJson(`/api/structure/modules/${moduleId}`, { method: 'PATCH', body: payload })));
            setPendingModuleUpdates({});
            setEditingModuleIds({});
            await refresh();
            showToast({ title: 'Guardado completo', message: 'Los cambios de la estructura se guardaron correctamente.', type: 'success' });
        } catch (saveError) {
            showToast({ title: 'Error al guardar', message: saveError?.message || 'No se pudieron guardar algunos cambios.', type: 'error' });
        } finally {
            setSavingStructure(false);
        }
    };

    const patchEntity = async (entity, id, body) => {
        await apiJson(`/api/structure/${entity}/${id}`, { method: 'PATCH', body });
        await refresh();
    };

    const deleteEntity = async (entity, id, confirmationMessage) => {
        if (!window.confirm(confirmationMessage)) return;
        await apiJson(`/api/structure/${entity}/${id}`, { method: 'DELETE' });
        await refresh();
    };

    const handleCreateModule = async () => {
        if (!property?.id) {
            showToast({ title: 'Sin propiedad activa', message: 'No hay una propiedad disponible.', type: 'error' });
            return;
        }
        setCreatingModule(true);
        try {
            const number = Number(getNextModuleNumber(property?.modules || []));
            await apiJson('/api/structure/modules', { method: 'POST', body: { property_id: property.id, number, name: `Bloque ${number}`, category: 'hotel' } });
            await refresh();
            showToast({ title: 'Bloque creado', message: 'El bloque base se agregó correctamente.', type: 'success' });
        } catch (createError) {
            showToast({ title: 'No se pudo crear el bloque', message: createError?.message?.replace(/^Error:\s*/i, '') || 'No se pudo crear el bloque.', type: 'error' });
        } finally {
            setCreatingModule(false);
        }
    };

    const handleDeleteModule = (id) => deleteEntity('modules', id, '¿Eliminar este módulo y todo su contenido?');
    const handleCreateFloor = (moduleId, body) => apiJson('/api/structure/floors', { method: 'POST', body: { module_id: moduleId, ...body } }).then(refresh);
    const handleSaveFloor = (id, body) => patchEntity('floors', id, body);
    const handleDeleteFloor = (id) => deleteEntity('floors', id, '¿Eliminar este piso y todas sus habitaciones?');
    const handleCreateRoom = (floorId, body) => apiJson('/api/structure/rooms', { method: 'POST', body: { floor_id: floorId, ...body } }).then(refresh);
    const handleSaveRoom = (id, body) => patchEntity('rooms', id, body);
    const handleDeleteRoom = (id) => deleteEntity('rooms', id, '¿Eliminar esta habitación?');
    const handleToggleModule = (id, newActive) => patchEntity('modules', id, { is_active: newActive });
    const handleToggleFloor = (id, newActive) => patchEntity('floors', id, { is_active: newActive });
    const handleToggleRoom = (id, newStatus) => patchEntity('rooms', id, { status: newStatus });

    if (loading && !property) {
        return <LoadingSpinner />;
    }

    const totalBuildings = property?.modules?.length || 0;
    const totalFloors = property?.modules?.reduce((a, m) => a + m.floors.length, 0) || 0;
    const totalRooms = property?.modules?.reduce((a, m) => a + m.floors.reduce((fa, f) => fa + f.rooms.length, 0), 0) || 0;
    const activeRooms = property?.modules?.reduce((a, m) => a + m.floors.reduce((fa, f) => fa + f.rooms.filter((r) => r.status === 'active').length, 0), 0) || 0;
    const maintenanceRooms = totalRooms - activeRooms;
    const hasPending = Object.keys(pendingModuleUpdates).length > 0;

    return (
        <div className="p-6 space-y-6 pb-24">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-2 text-[var(--color-primary)]">
                    <MapPin className="h-5 w-5" />
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Estructura Hotelera</h2>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" icon={Check} onClick={handleGlobalSave} disabled={!hasPending || savingStructure} loading={savingStructure}>
                        Guardar cambios
                    </Button>
                    <Button variant="register" icon={Plus} onClick={handleCreateModule} loading={creatingModule}>
                        Añadir bloque
                    </Button>
                </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            {property && (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard icon={Building2} title="Bloques" value={totalBuildings} subtitle={totalBuildings > 0 ? `${totalBuildings} módulos` : 'Sin bloques'} iconClassName="text-sky-500" iconBgClassName="bg-sky-500/10" />
                    <StatCard icon={Layers} title="Pisos" value={totalFloors} subtitle={totalFloors > 0 ? `${Math.ceil(totalFloors / Math.max(totalBuildings, 1))} por bloque` : 'Sin pisos'} iconClassName="text-amber-500" iconBgClassName="bg-amber-500/10" />
                    <StatCard icon={BedDouble} title="Habitaciones activas" value={activeRooms} subtitle={`${activeRooms}/${totalRooms}`} variant="success" />
                    <StatCard icon={Wrench} title="En mantenimiento" value={maintenanceRooms} subtitle={maintenanceRooms > 0 ? 'Revisar disponibilidad' : 'Todo operativo'} variant="danger" />
                </div>
            )}

            <div className="space-y-4">
                {property?.modules?.map((module) => (
                    <ModuleCard
                        key={module.id}
                        module={module}
                        roomTypes={roomTypes}
                        isEditable={isModuleEditable(module.id)}
                        canEditType={canEditType}
                        onToggleEditMode={toggleModuleEditMode}
                        onDraftChange={handleModuleDraftChange}
                        onDeleteModule={handleDeleteModule}
                        onCreateFloor={handleCreateFloor}
                        onSaveFloor={handleSaveFloor}
                        onDeleteFloor={handleDeleteFloor}
                        onCreateRoom={handleCreateRoom}
                        onSaveRoom={handleSaveRoom}
                        onDeleteRoom={handleDeleteRoom}
                        onToggleModule={handleToggleModule}
                        onToggleFloor={handleToggleFloor}
                        onToggleRoom={handleToggleRoom}
                    />
                ))}

                {(!property?.modules || property.modules.length === 0) && (
                    <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-12 text-center">
                        <Building2 className="mx-auto mb-3 h-10 w-10 text-[var(--color-text-muted)]" />
                        <h3 className="text-base font-medium text-[var(--color-text-primary)]">Sin estructura</h3>
                        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Crea el primer módulo arriba para empezar.</p>
                    </div>
                )}
            </div>
        </div>
    );
}