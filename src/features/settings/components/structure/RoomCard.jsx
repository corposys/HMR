import React from 'react';
import { BedDouble, Pencil, Trash2 } from 'lucide-react';
import ToggleSwitch from '@shared/common/ToggleSwitch';

export default function RoomCard({ room, roomTypes, isEditable, canEditType, onSave, onDelete, onToggle }) {
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
}
