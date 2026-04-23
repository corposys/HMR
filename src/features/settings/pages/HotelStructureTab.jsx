import React, { useCallback, useEffect, useState } from 'react';
import {
    Building2, MapPin, Layers, BedDouble, Wrench,
    ChevronRight, ChevronDown, Plus, AlertCircle,
    Loader2, Trash2, Check, Pencil
} from 'lucide-react';
import Button from '@shared/common/Button';
import { useToast } from '@context/ToastContext';

const apiJson = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
};

const getNextModuleNumber = (modules = []) => String(modules.reduce((max, module) => Math.max(max, Number(module.number) || 0), 0) + 1);
const ROOM_CARD_MIN_WIDTH = 170;
const ROOM_GRID_MAX_COLUMNS = 12;

const ToggleSwitch = ({ checked, onChange, disabled, size = 'md', activeLabel, inactiveLabel }) => {
    const height = size === 'sm' ? 'h-5' : 'h-6';
    const width = size === 'sm' ? 'w-9' : 'w-11';
    const circleSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    const translate = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

    return (
        <div className="flex items-center gap-2">
            {(activeLabel || inactiveLabel) && (
                <span className={`text-[10px] font-bold uppercase tracking-wider ${checked ? 'text-emerald-500' : 'text-zinc-500'}`}>
                    {checked ? activeLabel : inactiveLabel}
                </span>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${height} ${width} ${checked ? 'bg-[var(--color-primary)]' : 'bg-zinc-700'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
                <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute left-[2px] top-1/2 inline-block -translate-y-1/2 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${circleSize} ${checked ? translate : 'translate-x-0'}`}
                />
            </button>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, subtext, colorClass, bgClass }) => (
    <div className="flex items-start justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 shadow-sm transition-colors hover:border-[var(--color-border-hover)]">
        <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">{label}</p>
            <h4 className="mt-0.5 text-xl font-bold text-[var(--color-text-primary)]">{value}</h4>
            {subtext && <p className="mt-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">{subtext}</p>}
        </div>
        <div className={`rounded-lg p-2 ${bgClass}`}>
            <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
    </div>
);

const RoomCard = ({ room, isEditable, onSave, onDelete, onToggle }) => {
    const isActive = room.status === 'active';

    const handleEditRoomNumber = async () => {
        if (!isEditable || !onSave) {
            return;
        }

        const currentRoomNumber = String(room.room_number || '');
        const nextRoomNumber = window.prompt('Nuevo número de habitación', currentRoomNumber);
        if (nextRoomNumber === null) {
            return;
        }

        const trimmedRoomNumber = nextRoomNumber.trim();
        if (!trimmedRoomNumber || trimmedRoomNumber === currentRoomNumber) {
            return;
        }

        await onSave(room.id, { room_number: trimmedRoomNumber });
    };

    return (
        <div className={`group relative flex w-full min-w-0 min-h-[112px] flex-col rounded-xl border p-2 transition-all duration-200 hover:border-[var(--color-primary)] ${isActive ? 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]' : 'border-red-900/20 bg-black/40'}`}>
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <BedDouble className={`h-4 w-4 ${isActive ? 'text-[var(--color-primary)]' : 'text-red-900/40'}`} />
                    <h4 className="text-base font-semibold leading-none tracking-tight text-[var(--color-text-primary)]">{room.room_number}</h4>
                </div>
                <ToggleSwitch checked={isActive} onChange={(value) => onToggle(room.id, value ? 'active' : 'inactive')} disabled={!isEditable} size="sm" />
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

            {!isActive && (
                <div className="mt-2 flex items-center gap-1 text-red-900/60">
                    <span className="text-[9px] font-black tracking-tighter">O.O.O</span>
                    <AlertCircle className="h-2.5 w-2.5" />
                </div>
            )}
        </div>
    );
};

const FloorSection = ({ moduleId, floor, isEditable, onSaveFloor, onDeleteFloor, onCreateRoom, onSaveRoom, onDeleteRoom, onToggleFloor, onToggleRoom }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showNewRoomForm, setShowNewRoomForm] = useState(false);
    const [roomForm, setRoomForm] = useState({ roomNumber: '' });
    const [roomViewMode, setRoomViewMode] = useState('fixed');
    const [roomColumns, setRoomColumns] = useState(4);

    useEffect(() => {
        if (!isEditable) {
            setShowNewRoomForm(false);
        }
    }, [isEditable]);

    const handleCreateRoom = async (event) => {
        event.preventDefault();
        if (!roomForm.roomNumber.trim()) {
            return;
        }
        await onCreateRoom(floor.id, {
            room_number: roomForm.roomNumber.trim(),
            category: 'hotel',
        });
        setRoomForm({ roomNumber: '' });
        setShowNewRoomForm(false);
    };

    const floorTitle = floor.name?.trim() || floor.code;

    const requestedColumns = Math.max(1, Math.min(ROOM_GRID_MAX_COLUMNS, Number(roomColumns) || 1));
    const effectiveColumns = requestedColumns;
    const gridStyle = roomViewMode === 'fixed'
        ? { gridTemplateColumns: `repeat(${effectiveColumns}, minmax(0, 1fr))` }
        : { gridTemplateColumns: `repeat(auto-fit, minmax(${ROOM_CARD_MIN_WIDTH}px, 1fr))` };

    return (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] transition-colors hover:border-[var(--color-border-hover)]">
            <div className="flex flex-col gap-2 border-b border-[var(--color-border)]/60 bg-[var(--color-bg-primary)]/40 px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between">
                <button
                    type="button"
                    onClick={() => setIsExpanded((current) => !current)}
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

                <div className="flex flex-wrap items-center gap-1.5 text-[10px]" onClick={(event) => event.stopPropagation()}>
                    <span className="text-[var(--color-text-muted)]">Vista</span>
                    <select
                        value={roomViewMode}
                        onChange={(event) => setRoomViewMode(event.target.value)}
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
                            onChange={(event) => {
                                const rawValue = Number(event.target.value);
                                if (Number.isNaN(rawValue)) {
                                    return;
                                }
                                const safeValue = Math.max(1, Math.min(ROOM_GRID_MAX_COLUMNS, rawValue));
                                setRoomColumns(safeValue);
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
                                isEditable={isEditable}
                                onSave={onSaveRoom}
                                onDelete={onDeleteRoom}
                                onToggle={onToggleRoom}
                            />
                        ))}

                        {isEditable && showNewRoomForm ? (
                            <form
                                onSubmit={handleCreateRoom}
                                className="relative flex w-full min-w-0 min-h-[112px] flex-col rounded-xl border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-bg-secondary)] p-2"
                            >
                                <div className="mb-2 flex items-center gap-2">
                                    <BedDouble className="h-4 w-4 text-[var(--color-primary)]" />
                                    <input
                                        type="text"
                                        autoFocus
                                        value={roomForm.roomNumber}
                                        onChange={(event) => setRoomForm((current) => ({ ...current, roomNumber: event.target.value }))}
                                        placeholder="Número"
                                        className="min-w-0 flex-1 border-0 bg-transparent px-0 text-base font-semibold leading-none tracking-tight text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none"
                                    />
                                </div>

                                <div className="mt-auto grid w-full grid-cols-2 gap-1">
                                    <button
                                        type="submit"
                                        className="inline-flex h-6 w-full min-w-0 items-center justify-center truncate rounded-md border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-1 text-[10px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
                                    >
                                        Agregar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowNewRoomForm(false);
                                            setRoomForm({ roomNumber: '' });
                                        }}
                                        className="inline-flex h-6 w-full min-w-0 items-center justify-center truncate rounded-md border border-[var(--color-border)] px-1 text-[10px] font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]"
                                    >
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

const ModuleCard = ({ module, isEditable, onToggleEditMode, onDraftChange, onDeleteModule, onCreateFloor, onSaveFloor, onDeleteFloor, onCreateRoom, onSaveRoom, onDeleteRoom, onToggleModule, onToggleFloor, onToggleRoom }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const defaultModuleName = `Bloque ${module.number}`;
    const normalizedModuleName = (module.name || '').trim();
    const currentModuleName = normalizedModuleName || defaultModuleName;
    const [name, setName] = useState(currentModuleName);
    const [category, setCategory] = useState(module.category || 'hotel');
    const [showNewFloorForm, setShowNewFloorForm] = useState(false);
    const [floorForm, setFloorForm] = useState({ name: '' });

    useEffect(() => {
        if (!isEditable) {
            setShowNewFloorForm(false);
        }
    }, [isEditable]);

    useEffect(() => {
        setName(currentModuleName);
        setCategory(module.category || 'hotel');
    }, [module.id, currentModuleName, module.category]);

    const nameToSave = name.trim() || defaultModuleName;
    const hasDraftChanges = nameToSave !== currentModuleName || category !== (module.category || 'hotel');

    useEffect(() => {
        if (!onDraftChange) {
            return;
        }

        if (hasDraftChanges) {
            onDraftChange(module.id, {
                name: nameToSave,
                category,
            });
            return;
        }

        onDraftChange(module.id, null);
    }, [onDraftChange, hasDraftChanges, module.id, nameToSave, category]);

    const handleCreateFloor = async (event) => {
        event.preventDefault();
        if (!floorForm.name.trim()) {
            return;
        }
        const floorName = floorForm.name.trim();
        await onCreateFloor(module.id, {
            code: floorName,
            name: floorName,
        });
        setFloorForm({ name: '' });
        setShowNewFloorForm(false);
    };

    const totalFloors = module.floors.length;
    const totalRooms = module.floors.reduce((accumulator, floor) => accumulator + floor.rooms.length, 0);
    const activeRooms = module.floors.reduce((accumulator, floor) => accumulator + floor.rooms.filter((room) => room.status === 'active').length, 0);

    const handleHeaderToggle = (event) => {
        if (event.target.closest('[data-module-interactive]')) {
            return;
        }
        setIsExpanded((current) => !current);
    };

    return (
        <div className={`group rounded-xl border bg-[var(--color-bg-secondary)] shadow-sm transition-all duration-300 ${module.is_active ? 'border-[var(--color-border)]' : 'border-red-900/30 bg-red-950/10'}`}>
            <div className={`flex flex-col gap-3 rounded-t-xl p-3 ${module.is_active ? 'bg-[var(--color-bg-tertiary)]/30' : 'bg-transparent'}`}>
                <div
                    className="flex cursor-pointer flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
                    onClick={handleHeaderToggle}
                >
                    <div className="flex flex-1 items-start gap-3">
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                setIsExpanded((current) => !current);
                            }}
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
                                    onChange={(event) => setName(event.target.value)}
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
                            isEditable={isEditable}
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
                        <form
                            onSubmit={handleCreateFloor}
                            className="relative flex min-h-[112px] flex-col rounded-xl border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-bg-secondary)] p-3"
                        >
                            <div className="mb-2 flex items-center gap-2">
                                <Layers className="h-5 w-5 text-[var(--color-primary)]" />
                                <input
                                    type="text"
                                    autoFocus
                                    value={floorForm.name}
                                    onChange={(event) => setFloorForm((current) => ({ ...current, name: event.target.value }))}
                                    placeholder="Nombre del nivel"
                                        className="min-w-0 flex-1 border-0 bg-transparent px-0 text-lg font-semibold leading-none tracking-tight text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none"
                                />
                            </div>

                            <div className="absolute bottom-3 right-3 flex items-center gap-1">
                                <button
                                    type="submit"
                                    className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 text-[11px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
                                >
                                    Crear
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewFloorForm(false);
                                        setFloorForm({ name: '' });
                                    }}
                                    className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color-border)] px-2 text-[11px] font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]"
                                >
                                    Cancelar
                                </button>
                            </div>

                        </form>
                    ) : isEditable ? (
                        <button
                            type="button"
                            onClick={() => setShowNewFloorForm(true)}
                            className="flex w-full min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-primary)]/35 px-4 text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)]"
                        >
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                <Plus className="h-4 w-4" />
                            </span>
                            <span className="text-[11px] font-semibold uppercase tracking-wider">Añadir nivel</span>
                        </button>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default function HotelStructureTab() {
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creatingModule, setCreatingModule] = useState(false);
    const [savingStructure, setSavingStructure] = useState(false);
    const [pendingModuleUpdates, setPendingModuleUpdates] = useState({});
    const [editingModuleIds, setEditingModuleIds] = useState({});
    const { showToast } = useToast();

    const fetchTree = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await apiJson('/api/structure/tree');
            setProperty(data.property);
        } catch (fetchError) {
            const message = fetchError.message;
            setError(message);
            showToast({ title: 'No se pudo cargar la estructura', message, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchTree();
    }, [fetchTree]);

    const refresh = async () => fetchTree();

    const isModuleEditable = useCallback((moduleId) => Boolean(editingModuleIds[String(moduleId)]), [editingModuleIds]);

    const toggleModuleEditMode = useCallback((moduleId) => {
        setEditingModuleIds((current) => {
            const key = String(moduleId);
            if (current[key]) {
                const { [key]: _removed, ...rest } = current;
                return rest;
            }

            return {
                ...current,
                [key]: true,
            };
        });
    }, []);

    const handleModuleDraftChange = useCallback((moduleId, payload) => {
        setPendingModuleUpdates((current) => {
            const key = String(moduleId);
            if (!payload) {
                if (!(key in current)) {
                    return current;
                }
                const { [key]: _removed, ...rest } = current;
                return rest;
            }

            const existing = current[key];
            if (existing && existing.name === payload.name && existing.category === payload.category) {
                return current;
            }

            return {
                ...current,
                [key]: payload,
            };
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
            await Promise.all(entries.map(([moduleId, payload]) => apiJson(`/api/structure/modules/${moduleId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })));

            setPendingModuleUpdates({});
            setEditingModuleIds({});
            await refresh();
            showToast({ title: 'Guardado completo', message: 'Los cambios de la estructura se guardaron correctamente.', type: 'success' });
        } catch (saveError) {
            const message = saveError?.message || 'No se pudieron guardar algunos cambios.';
            showToast({ title: 'Error al guardar', message, type: 'error' });
        } finally {
            setSavingStructure(false);
        }
    };

    const patchEntity = async (entity, id, body) => {
        await apiJson(`/api/structure/${entity}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        await refresh();
    };

    const deleteEntity = async (entity, id, confirmationMessage) => {
        if (!window.confirm(confirmationMessage)) {
            return;
        }

        await apiJson(`/api/structure/${entity}/${id}`, {
            method: 'DELETE',
        });
        await refresh();
    };

    const handleCreateModule = async () => {
        if (!property?.id) {
            showToast({ title: 'Sin propiedad activa', message: 'No hay una propiedad disponible para crear la estructura.', type: 'error' });
            return;
        }

        setCreatingModule(true);
        try {
            const number = Number(getNextModuleNumber(property?.modules || []));
            await apiJson('/api/structure/modules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    property_id: property.id,
                    number,
                    name: `Bloque ${number}`,
                    category: 'hotel',
                }),
            });

            await refresh();
            showToast({ title: 'Bloque creado', message: 'El bloque base se agregó correctamente.', type: 'success' });
        } catch (createError) {
            const message = createError?.message?.replace(/^Error:\s*/i, '') || 'No se pudo crear el bloque.';
            showToast({ title: 'No se pudo crear el bloque', message, type: 'error' });
        } finally {
            setCreatingModule(false);
        }
    };

    const handleDeleteModule = (id) => deleteEntity('modules', id, '¿Eliminar este módulo y todo su contenido?');
    const handleCreateFloor = (moduleId, body) => apiJson('/api/structure/floors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: moduleId, ...body }),
    }).then(refresh);
    const handleSaveFloor = (id, body) => patchEntity('floors', id, body);
    const handleDeleteFloor = (id) => deleteEntity('floors', id, '¿Eliminar este piso y todas sus habitaciones?');
    const handleCreateRoom = (floorId, body) => apiJson('/api/structure/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor_id: floorId, ...body }),
    }).then(refresh);
    const handleSaveRoom = (id, body) => patchEntity('rooms', id, body);
    const handleDeleteRoom = (id) => deleteEntity('rooms', id, '¿Eliminar esta habitación?');
    const handleToggleModule = (id, newActive) => patchEntity('modules', id, { is_active: newActive });
    const handleToggleFloor = (id, newActive) => patchEntity('floors', id, { is_active: newActive });
    const handleToggleRoom = (id, newStatus) => patchEntity('rooms', id, { status: newStatus });

    if (loading && !property) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    const totalBuildings = property?.modules?.length || 0;
    const totalFloors = property?.modules?.reduce((accumulator, module) => accumulator + module.floors.length, 0) || 0;
    const totalRooms = property?.modules?.reduce((accumulator, module) => accumulator + module.floors.reduce((floorAcc, floor) => floorAcc + floor.rooms.length, 0), 0) || 0;
    const activeRooms = property?.modules?.reduce((accumulator, module) => accumulator + module.floors.reduce((floorAcc, floor) => floorAcc + floor.rooms.filter((room) => room.status === 'active').length, 0), 0) || 0;
    const maintenanceRooms = totalRooms - activeRooms;
    const hasPendingStructureChanges = Object.keys(pendingModuleUpdates).length > 0;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <div className="mb-1 flex items-center gap-2 text-[var(--color-primary)]">
                        <MapPin className="h-6 w-6" />
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Estructura Hotelera</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        icon={Check}
                        onClick={handleGlobalSave}
                        disabled={!hasPendingStructureChanges || savingStructure}
                        className="!rounded-full !px-5"
                    >
                        {savingStructure ? 'Guardando...' : 'Guardar'}
                    </Button>
                    <Button variant="register" icon={Plus} onClick={handleCreateModule} disabled={creatingModule}>
                        {creatingModule ? 'Creando bloque...' : 'Añadir bloque'}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {property && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard icon={Building2} label="Bloques" value={totalBuildings} subtext={totalBuildings > 0 ? `${totalBuildings} módulos` : 'Sin bloques'} bgClass="bg-sky-500/10" colorClass="text-sky-500" />
                    <StatCard icon={Layers} label="Pisos" value={totalFloors} subtext={totalFloors > 0 ? `${Math.ceil(totalFloors / Math.max(totalBuildings, 1))} por bloque aprox.` : 'Sin pisos'} bgClass="bg-amber-500/10" colorClass="text-amber-500" />
                    <StatCard icon={BedDouble} label="Habitaciones activas" value={activeRooms} subtext={`${activeRooms}/${totalRooms}`} bgClass="bg-emerald-500/10" colorClass="text-emerald-500" />
                    <StatCard icon={Wrench} label="En mantenimiento" value={maintenanceRooms} subtext={maintenanceRooms > 0 ? 'Revisar disponibilidad' : 'Todo operativo'} bgClass="bg-rose-500/10" colorClass="text-rose-500" />
                </div>
            )}

            <div className="space-y-6">
                {property?.modules?.map((module) => (
                    <ModuleCard
                        key={module.id}
                        module={module}
                        isEditable={isModuleEditable(module.id)}
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