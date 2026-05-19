import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Layers, BedDouble, Plus, Trash2 } from 'lucide-react';
import RoomCard from './RoomCard';

const ROOM_CARD_MIN_WIDTH = 170;
const ROOM_GRID_MAX_COLUMNS = 12;

export function FloorSection({ floor, roomTypes, isEditable, canEditType, onDeleteFloor, onCreateRoom, onSaveRoom, onDeleteRoom, onToggleRoom }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showNewRoomForm, setShowNewRoomForm] = useState(false);
    const [roomForm, setRoomForm] = useState({ roomNumber: '' });
    const [roomViewMode, setRoomViewMode] = useState('fixed');
    const [roomColumns, setRoomColumns] = useState(4);

    const prevIsEditable = useRef(isEditable);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (prevIsEditable.current && !isEditable) setShowNewRoomForm(false);
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
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] transition-colors hover:border-[var(--color-border-hover)]">
            <div className="flex flex-col gap-2 border-b border-[var(--color-border)]/60 bg-[var(--color-bg-primary)]/40 px-3 py-2.5 lg:flex-row lg:items-center lg:justify-between">
                <button
                    type="button"
                    onClick={() => setIsExpanded((c) => !c)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left transition-colors hover:text-[var(--color-text-primary)]"
                    aria-label={isExpanded ? 'Contraer piso' : 'Expandir piso'}
                >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--color-text-muted)]">
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    </span>
                    <Layers className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{floorTitle}</span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">|</span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">{floor.rooms.length} hab.</span>
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
                        />
                    </label>
                    {isEditable && (
                        <button type="button" onClick={() => onDeleteFloor(floor.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 text-red-300 transition-colors hover:border-red-400/60 hover:bg-red-500/20" title="Eliminar piso">
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-3 p-3">
                    <div className="grid auto-rows-fr gap-2" style={gridStyle}>
                        {floor.rooms.map((room) => (
                            <RoomCard key={room.id} room={room} roomTypes={roomTypes} isEditable={isEditable} canEditType={canEditType} onSave={onSaveRoom} onDelete={onDeleteRoom} onToggle={onToggleRoom} />
                        ))}

                        {isEditable && showNewRoomForm ? (
                            <form onSubmit={handleCreateRoom} className="relative flex w-full min-w-0 min-h-[112px] flex-col rounded-xl border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-bg-secondary)] p-2">
                                <div className="mb-2 flex items-center gap-2">
                                    <BedDouble className="h-4 w-4 text-[var(--color-primary)]" />
                                    <input type="text" autoFocus value={roomForm.roomNumber} onChange={(e) => setRoomForm((c) => ({ ...c, roomNumber: e.target.value }))} placeholder="Número" className="min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-semibold leading-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none" />
                                </div>
                                <div className="mt-auto grid w-full grid-cols-2 gap-1">
                                    <button type="submit" className="inline-flex h-6 w-full min-w-0 items-center justify-center truncate rounded-md border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-1 text-[10px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20">Agregar</button>
                                    <button type="button" onClick={() => { setShowNewRoomForm(false); setRoomForm({ roomNumber: '' }); }} className="inline-flex h-6 w-full min-w-0 items-center justify-center truncate rounded-md border border-[var(--color-border)] px-1 text-[10px] font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]">Cancelar</button>
                                </div>
                            </form>
                        ) : isEditable ? (
                            <button type="button" onClick={() => setShowNewRoomForm(true)} className="flex w-full min-w-0 min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)]">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"><Plus className="h-4 w-4" /></span>
                                <span className="text-[11px] font-semibold uppercase tracking-wider">Añadir hab.</span>
                            </button>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}