import { useState, useEffect, useRef } from 'react';
import { Building2, ChevronRight, ChevronDown, Plus, Trash2, Layers } from 'lucide-react';
import ToggleSwitch from '@shared/common/ToggleSwitch';
import { FloorSection } from './FloorSection';

export function ModuleCard({ module, roomTypes, isEditable, canEditType, onToggleEditMode, onDraftChange, onDeleteModule, onCreateFloor, onSaveFloor, onDeleteFloor, onCreateRoom, onSaveRoom, onDeleteRoom, onToggleModule, onToggleFloor, onToggleRoom }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const defaultModuleName = `Bloque ${module.number}`;
    const normalizedModuleName = (module.name || '').trim();
    const currentModuleName = normalizedModuleName || defaultModuleName;
    const [name, setName] = useState(currentModuleName);
    const [category, setCategory] = useState(module.category || 'hotel');
    const [showNewFloorForm, setShowNewFloorForm] = useState(false);
    const [floorForm, setFloorForm] = useState({ name: '' });

    const prevIsEditable = useRef(isEditable);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (prevIsEditable.current && !isEditable) setShowNewFloorForm(false);
        prevIsEditable.current = isEditable;
    }, [isEditable]);

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
                        <button type="button" onClick={(e) => { e.stopPropagation(); setIsExpanded((c) => !c); }} data-module-interactive className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)]" aria-label={isExpanded ? 'Contraer módulo' : 'Expandir módulo'}>
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${module.is_active ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'bg-red-900/20 text-red-700'}`}>
                            <Building2 className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                                <input type="text" data-module-interactive value={name} onChange={(e) => setName(e.target.value)} placeholder={defaultModuleName} readOnly={!isEditable} className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition-colors focus:outline-none md:w-1/2 md:max-w-[320px] ${isEditable ? 'border-[var(--color-border)]/80 bg-[var(--color-bg-secondary)]/80 text-[var(--color-text-primary)] focus:border-[var(--color-primary)]/60 focus:bg-[var(--color-bg-secondary)]' : 'cursor-not-allowed border-[var(--color-border)]/60 bg-[var(--color-bg-primary)]/60 text-[var(--color-text-secondary)]'}`} />
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
                        <button type="button" onClick={() => onToggleEditMode(module.id)} className={`inline-flex items-center justify-center rounded-md border px-2.5 py-2 text-xs font-semibold transition-colors ${isEditable ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:border-amber-400/60 hover:bg-amber-500/20' : 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20'}`}>
                            {isEditable ? 'Bloquear' : 'Editar'}
                        </button>
                        <button type="button" onClick={() => onDeleteModule(module.id)} disabled={!isEditable} className={`inline-flex items-center justify-center rounded-md border px-2.5 py-2 text-xs font-semibold transition-colors ${isEditable ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-400/60 hover:bg-red-500/20' : 'cursor-not-allowed border-red-500/20 bg-red-500/5 text-red-300/40 opacity-60'}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className={`space-y-3 p-3 ${!module.is_active ? 'pointer-events-none opacity-40 grayscale' : ''}`}>
                    {module.floors.map((floor) => (
                        <FloorSection key={floor.id} moduleId={module.id} floor={floor} roomTypes={roomTypes} isEditable={isEditable} canEditType={canEditType} onSaveFloor={onSaveFloor} onDeleteFloor={onDeleteFloor} onCreateRoom={onCreateRoom} onSaveRoom={onSaveRoom} onDeleteRoom={onDeleteRoom} onToggleFloor={onToggleFloor} onToggleRoom={onToggleRoom} />
                    ))}

                    {isEditable && showNewFloorForm ? (
                        <form onSubmit={handleCreateFloor} className="relative flex min-h-[112px] flex-col rounded-xl border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-bg-secondary)] p-3">
                            <div className="mb-2 flex items-center gap-2">
                                <Layers className="h-5 w-5 text-[var(--color-primary)]" />
                                <input type="text" autoFocus value={floorForm.name} onChange={(e) => setFloorForm((c) => ({ ...c, name: e.target.value }))} placeholder="Nombre del nivel" className="min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-semibold leading-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]/60 focus:outline-none" />
                            </div>
                            <div className="absolute bottom-3 right-3 flex items-center gap-1">
                                <button type="submit" className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-2 text-[11px] font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20">Crear</button>
                                <button type="button" onClick={() => { setShowNewFloorForm(false); setFloorForm({ name: '' }); }} className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--color-border)] px-2 text-[11px] font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]">Cancelar</button>
                            </div>
                        </form>
                    ) : isEditable ? (
                        <button type="button" onClick={() => setShowNewFloorForm(true)} className="flex w-full min-h-[112px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-primary)]/35 px-4 text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-text-primary)]">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]"><Plus className="h-4 w-4" /></span>
                            <span className="text-[11px] font-semibold uppercase tracking-wider">Añadir nivel</span>
                        </button>
                    ) : null}
                </div>
            )}
        </div>
    );
}