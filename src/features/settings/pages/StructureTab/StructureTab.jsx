import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Building2, MapPin, Layers, BedDouble, Wrench,
    ChevronRight, ChevronDown, Plus, Pencil, Trash2, Check
} from 'lucide-react';
import Button from '@shared/common/Button';
import StatCard from '@shared/common/StatCard';
import ToggleSwitch from '@shared/common/ToggleSwitch';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import Alert from '@shared/common/Alert';
import { apiJson } from '@utils/api';
import { useToast } from '@context/ToastContext';
import { usePermissions } from '@hooks/usePermissions';

const getNextModuleNumber = (modules = []) => String(modules.reduce((max, m) => Math.max(max, Number(m.number) || 0), 0) + 1);
const ROOM_CARD_MIN_WIDTH = 170;
const ROOM_GRID_MAX_COLUMNS = 12;

const RoomCard = ({ room, roomTypes, isEditable, canEditType, onSave, onDelete, onToggle }) => {
    const isActive = room.status === 'active';

    const handleEditRoomNumber = async () => {
        if (!isEditable || !onSave) return;
        const currentRoomNumber = String(room.room_number || '');
        const nextRoomNumber = window.prompt('Nuevo número de habitación', currentRoomNumber);
        if (nextRoomNumber === null) return;
        const trimmed = nextRoomNumber.trim();
        if (!trimmed || trimmed === currentRoomNumber) return;
        await onSave(room.id, { room_number: trimmed });
    };

    const handleTypeChange = async (e) => {
        const typeId = e.target.value ? parseInt(e.target.value) : null;
        if (typeId === room.room_type_id) return;
        await onSave(room.id, { room_type_id: typeId });
    };

    return (
        <div className={`group relative flex w-full min-w-0 min-h-[128px] flex-col rounded-xl border p-2 transition-all duration-200 hover:border-[var(--color-primary)] ${isActive ? 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]' : 'border-red-900/20 bg-black/40'}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <BedDouble className={`h-4 w-4 ${isActive ? 'text-[var(--color-primary)]' : 'text-red-900/40'}`} />
                    <h4 className="text-base font-semibold leading-none tracking-tight text-[var(--color-text-primary)]">{room.room_number}</h4>
                </div>
                <ToggleSwitch checked={isActive} onChange={(value) => onToggle(room.id, value ? 'active' : 'inactive')} disabled={!isEditable} size="sm" />
            </div>

            <div className="mt-1">
                {canEditType && roomTypes.length > 0 ? (
                    <select
                        value={room.room_type_id || ''}
                        onChange={handleTypeChange}
                        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1 text-[11px] font-medium text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none"
                    >
                        <option value="">Sin tipo</option>
                        {roomTypes.map((rt) => (
                            <option key={rt.id} value={rt.id}>{rt.name}</option>
                        ))}
                    </select>
                ) : (
                    <div className="text-[11px] text-[var(--color-text-muted)] truncate">
                        {room.room_type_name || 'Sin tipo'}
                    </div>
                )}
            </div>

            {isEditable && (
                <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 opacity-0 transition-all duration-200 group-hover:opacity-100">
                    <button
                        type="button"
                        onClick={handleEditRoomNumber}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] transition-all duration-200 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)]"
                        aria-label="Editar habitación"
                        title="Editar habitación"
                    >
                        <Pencil className="h-3 w-3" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(room.id)}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)] transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                        aria-label="Eliminar habitación"
                        title="Eliminar habitación"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>
    );
};

const FloorSection = ({ floor, roomTypes, isEditable, canEditType, onDeleteFloor, onCreateRoom, onSaveRoom, onDeleteRoom, onToggleRoom }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showNewRoomForm, setShowNewRoomForm] = useState(false);
    const [roomForm, setRoomForm] = useState({ roomNumber: '' });
    const [roomViewMode, setRoomViewMode] = useState('fixed');
    const [roomColumns, setRoomColumns] = useState(4);

    // Close new room form when editing is disabled (using ref to avoid set-state-in-effect)
    const prevIsEditable = useRef(isEditable);
    useEffect(() => {
        if (prevIsEditable.current && !isEditable) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowNewRoomForm(false);
        }
        prevIsEditable.current = isEditable;
    }, [isEditable]);

    const handleCreateRoom = async (event) => {
        event.preventDefault();
        if (!roomForm.roomNumber.trim()) return;
        await onCreateRoom(floor.id, { room_number: roomForm.roomNumber.trim(), category: 'hotel' });
        setRoomForm({ roomNumber: '' });
        setShowNewRoomForm(false);
    };

    const floorTitle = floor.name?.trim() || floor.code;
    const requestedColumns = Math.max(1, Math.min(ROOM_GRID_MAX_COLUMNS, Number(roomColumns) || 1));
    const gridStyle = roomViewMode === 'fixed'
        ? { gridTemplateColumns: `repeat(${requestedColumns}, minmax(0, 1fr))` }
        : { gridTemplateColumns: `repeat(auto-fit, minmax(${ROOM_CARD_MIN_WIDTH}px, 1fr))` };

    return (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] transition-colors hover:border-[var(--color-border-hover)]">
            <div className="flex flex-col gap-2 border-b border-[var(--color-border)]/60 bg-[var(--color-bg-primary)]/40 px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between">
                <button
                    type="button"
                    onClick={() => setIsExpanded((c) => !c)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left transition-colors hover:text-[var(--color-text-primary)]"
                    aria-label={isExpanded ? 'Contraer piso' : 'Expandir piso'}
                    aria-expanded={isExpanded}
                >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </span>
                    <Layers className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="truncate text-base font-semibold text-[var(--color-text-primary)]">{floorTitle}</span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">|</span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">Habitaciones: {floor.rooms.length}</span>
                </button>

                <div className="flex flex-wrap items-center gap-1.5 text-[10px]" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[var(--color-text-muted)]">Vista</span>
                    <select
                        value={roomViewMode}
                        onChange={(e) => setRoomViewMode(e.target.value)}
                        className="h-7 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 text-[11px] font-semibold text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none"
                    >
                        <option value="fixed">Fijo</option>
                        <option value="auto">Auto</option>
                    </select>
                    <label className="flex items-center gap-1 text-[var(--color-text-muted)]">
                        <span>Hab/fila</span>
                        <input
                            type="number"
                            min={1}
                            max={ROOM_GRID_MAX_COLUMNS}
                            value={requestedColumns}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                if (!Number.isNaN(v)) setRoomColumns(Math.max(1, Math.min(ROOM_GRID_MAX_COLUMNS, v)));
                            }}
                            disabled={roomViewMode !== 'fixed'}
                            className="h-7 w-16 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-2 text-[11px] font-semibold text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none disabled:opacity-50"
                            aria-label="Habitaciones por fila"
                        />
                    </label>
                    {isEditable && (
                        <button
                            type="button"
                            onClick={() => onDeleteFloor(floor.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 text-red-300 transition-colors hover:border-red-400/60 hover:bg-red-500/20"
                            aria-label="Eliminar piso"
                            title="Eliminar piso"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-3 p-3">
                    <div className="grid auto-rows-fr gap-2" style={gridStyle}>
                        {floor.rooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                roomTypes={roomTypes}
                                isEditable={isEditable}
                                canEditType={canEditType}
                                onSave={onSaveRoom}
                                onDelete={onDeleteRoom}
                                onToggle={onToggleRoom}
                            />
                        ))}

                        {isEditable && showNewRoomForm ? (
                            <form onSubmit={handleCreateRoom} className="relative flex w-full min-w-0 min-h-[112px] flex-col rounded-xl border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-bg-secondary)] p-2">
                                <div className="mb-2 flex items-center gap-2">
                                    <BedDouble className="h-4 w-4 text-[var(--color-primary)]" />
                                    <input
                                        type="text"
                                        autoFocus
                                        value={roomForm.roomNumber}
                                        onChange={(e) => setRoomForm((c) => ({ ...c, roomNumber: e.target.value }))}
                                        placeholder="Número"
                                        className="min-w-0 flex-1 border-0 bg-transparent px-0 text-base font-semibold leading-none tracking-tight text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none"
                                    />
                                </div>
                                <div className="mt-auto grid w-full grid-cols-2 gap-1">
                                    <button type="submit" className="inline-flex h-6 w-full min-w-0 items-center justify-center truncate rounded-md border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-1 text-[10px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20">
                                        Agregar
                                    </button>
                                    <button type="button" onClick={() => { setShowNewRoomForm(false); setRoomForm({ roomNumber: '' }); }} className="inline-flex h-6 w-full min-w-0 items-center justify-center truncate rounded-md border border-[var(--color-border)] px-1 text-[10px] font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]">
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : isEditable ? (
                            <button
                                type="button"
                                onClick={() => setShowNewRoomForm(true)}
                                className="flex w-full min-w-0 min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)]"
                            >
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                    <Plus className="h-4 w-4" />
                                </span>
                                <span className="text-[11px] font-semibold uppercase tracking-wider">Añadir hab.</span>
                            </button>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
};

const ModuleCard = ({ module, roomTypes, isEditable, canEditType, onToggleEditMode, onDraftChange, onDeleteModule, onCreateFloor, onSaveFloor, onDeleteFloor, onCreateRoom, onSaveRoom, onDeleteRoom, onToggleModule, onToggleFloor, onToggleRoom }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const defaultModuleName = `Bloque ${module.number}`;
    const normalizedModuleName = (module.name || '').trim();
    const currentModuleName = normalizedModuleName || defaultModuleName;
    const [name, setName] = useState(currentModuleName);
    const [category, setCategory] = useState(module.category || 'hotel');
    const [showNewFloorForm, setShowNewFloorForm] = useState(false);
    const [floorForm, setFloorForm] = useState({ name: '' });

    // Close new floor form when editing is disabled
    const prevIsEditable = useRef(isEditable);
    useEffect(() => {
        if (prevIsEditable.current && !isEditable) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setShowNewFloorForm(false);
        }
        prevIsEditable.current = isEditable;
    }, [isEditable]);

    // Sync internal form state with external module changes (using ref to track module.id)
    const prevModuleId = useRef(module.id);
    useEffect(() => {
        if (prevModuleId.current !== module.id) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setName(currentModuleName);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCategory(module.category || 'hotel');
            prevModuleId.current = module.id;
        }
    }, [module.id, currentModuleName, module.category]);

    const nameToSave = name.trim() || defaultModuleName;
    const hasDraftChanges = nameToSave !== currentModuleName || category !== (module.category || 'hotel');

    useEffect(() => {
        if (!onDraftChange) return;
        onDraftChange(module.id, hasDraftChanges ? { name: nameToSave, category } : null);
    }, [onDraftChange, hasDraftChanges, module.id, nameToSave, category]);

    const handleCreateFloor = async (event) => {
        event.preventDefault();
        if (!floorForm.name.trim()) return;
        await onCreateFloor(module.id, { code: floorForm.name.trim(), name: floorForm.name.trim() });
        setFloorForm({ name: '' });
        setShowNewFloorForm(false);
    };

    const totalFloors = module.floors.length;
    const totalRooms = module.floors.reduce((a, f) => a + f.rooms.length, 0);
    const activeRooms = module.floors.reduce((a, f) => a + f.rooms.filter((r) => r.status === 'active').length, 0);

    return (
        <div className={`group rounded-xl border bg-[var(--color-bg-secondary)] shadow-sm transition-all duration-300 ${module.is_active ? 'border-[var(--color-border)]' : 'border-red-900/30 bg-red-950/10'}`}>
            <div className={`flex flex-col gap-3 rounded-t-xl p-3 ${module.is_active ? 'bg-[var(--color-bg-tertiary)]/30' : 'bg-transparent'}`}>
                <div className="flex cursor-pointer flex-col gap-3 lg:flex-row lg:items-start lg:justify-between" onClick={(e) => { if (!e.target.closest('[data-module-interactive]')) setIsExpanded((c) => !c); }}>
                    <div className="flex flex-1 items-start gap-3">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setIsExpanded((c) => !c); }}
                            data-module-interactive
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)]"
                            aria-label={isExpanded ? 'Contraer módulo' : 'Expandir módulo'}
                        >
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${module.is_active ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'bg-red-900/20 text-red-700'}`}>
                            <Building2 className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                                <input
                                    type="text"
                                    data-module-interactive
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={defaultModuleName}
                                    readOnly={!isEditable}
                                    className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition-colors focus:outline-none md:w-1/2 md:max-w-[320px] ${isEditable ? 'border-[var(--color-border)]/80 bg-[var(--color-bg-secondary)]/80 text-[var(--color-text-primary)] focus:border-[var(--color-primary)]/60 focus:bg-[var(--color-bg-secondary)]' : 'cursor-not-allowed border-[var(--color-border)]/60 bg-[var(--color-bg-primary)]/60 text-[var(--color-text-secondary)]'}`}
                                />
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                                    <span>Pisos: <strong className="text-[var(--color-text-secondary)]">{totalFloors}</strong></span>
                                    <span className="h-0.5 w-0.5 rounded-full bg-zinc-600" />
                                    <span>Habitaciones: <strong className="text-[var(--color-text-secondary)]">{totalRooms}</strong></span>
                                    <span className="h-0.5 w-0.5 rounded-full bg-zinc-600" />
                                    <span>Activas: <strong className="text-[var(--color-text-secondary)]">{activeRooms}</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:self-start" data-module-interactive>
                        <ToggleSwitch checked={module.is_active} onChange={(val) => onToggleModule(module.id, val)} disabled={!isEditable} activeLabel="Operativo" inactiveLabel="Clausurado" />
                        <button
                            type="button"
                            onClick={() => onToggleEditMode(module.id)}
                            className={`inline-flex items-center justify-center rounded-md border px-2.5 py-2 text-xs font-semibold transition-colors ${isEditable ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-400/60 hover:bg-amber-500/20' : 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20'}`}
                        >
                            {isEditable ? 'Bloquear' : 'Editar'}
                        </button>
                        <button
                            type="button"
                            onClick={() => onDeleteModule(module.id)}
                            disabled={!isEditable}
                            className={`inline-flex items-center justify-center rounded-md border px-2.5 py-2 text-xs font-semibold transition-colors ${isEditable ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400/60 hover:bg-red-500/20' : 'cursor-not-allowed border-red-500/20 bg-red-500/5 text-red-300/40 opacity-60'}`}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className={`space-y-3 p-3 ${!module.is_active ? 'pointer-events-none opacity-40 grayscale' : ''}`}>
                    {module.floors.map((floor) => (
                        <FloorSection
                            key={floor.id}
                            moduleId={module.id}
                            floor={floor}
                            roomTypes={roomTypes}
                            isEditable={isEditable}
                            canEditType={canEditType}
                            onSaveFloor={onSaveFloor}
                            onDeleteFloor={onDeleteFloor}
                            onCreateRoom={onCreateRoom}
                            onSaveRoom={onSaveRoom}
                            onDeleteRoom={onDeleteRoom}
                            onToggleFloor={onToggleFloor}
                            onToggleRoom={onToggleRoom}
                        />
                    ))}

                    {isEditable && showNewFloorForm ? (
                        <form onSubmit={handleCreateFloor} className="relative flex min-h-[112px] flex-col rounded-xl border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-bg-secondary)] p-3">
                            <div className="mb-2 flex items-center gap-2">
                                <Layers className="h-5 w-5 text-[var(--color-primary)]" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={floorForm.name}
                                    onChange={(e) => setFloorForm((c) => ({ ...c, name: e.target.value }))}
                                    placeholder="Nombre del nivel"
                                    className="min-w-0 flex-1 border-0 bg-transparent px-0 text-lg font-semibold leading-none tracking-tight text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none"
                                />
                            </div>
                            <div className="absolute bottom-3 right-3 flex items-center gap-1">
                                <button type="submit" className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 text-[11px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20">Crear</button>
                                <button type="button" onClick={() => { setShowNewFloorForm(false); setFloorForm({ name: '' }); }} className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color-border)] px-2 text-[11px] font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]">Cancelar</button>
                            </div>
                        </form>
                    ) : isEditable ? (
                        <button
                            type="button"
                            onClick={() => setShowNewFloorForm(true)}
                            className="flex w-full min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-primary)]/35 px-4 text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)]"
                        >
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"><Plus className="h-4 w-4" /></span>
                            <span className="text-[11px] font-semibold uppercase tracking-wider">Añadir nivel</span>
                        </button>
                    ) : null}
                </div>
            )}
        </div>
    );
};

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
        <div className="space-y-8 pb-20 animate-fade-in">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <div className="mb-1 flex items-center gap-2 text-[var(--color-primary)]">
                        <MapPin className="h-6 w-6" />
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Estructura Hotelera</h2>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" icon={Check} onClick={handleGlobalSave} disabled={!hasPending || savingStructure} loading={savingStructure} className="!rounded-full !px-5">
                        Guardar
                    </Button>
                    <Button variant="register" icon={Plus} onClick={handleCreateModule} loading={creatingModule}>
                        Añadir bloque
                    </Button>
                </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            {property && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard icon={Building2} title="Bloques" value={totalBuildings} subtitle={totalBuildings > 0 ? `${totalBuildings} módulos` : 'Sin bloques'} iconClassName="text-sky-500" iconBgClassName="bg-sky-500/10" />
                    <StatCard icon={Layers} title="Pisos" value={totalFloors} subtitle={totalFloors > 0 ? `${Math.ceil(totalFloors / Math.max(totalBuildings, 1))} por bloque aprox.` : 'Sin pisos'} iconClassName="text-amber-500" iconBgClassName="bg-amber-500/10" />
                    <StatCard icon={BedDouble} title="Habitaciones activas" value={activeRooms} subtitle={`${activeRooms}/${totalRooms}`} variant="success" />
                    <StatCard icon={Wrench} title="En mantenimiento" value={maintenanceRooms} subtitle={maintenanceRooms > 0 ? 'Revisar disponibilidad' : 'Todo operativo'} variant="danger" />
                </div>
            )}

            <div className="space-y-6">
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
                    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-16 text-center opacity-80">
                        <Building2 className="mx-auto mb-4 h-16 w-16 text-[var(--color-text-muted)]" />
                        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">Sin estructura</h3>
                        <p className="text-[var(--color-text-secondary)]">Crea el primer módulo arriba para empezar a añadir pisos y habitaciones.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
