import React, { useState, useEffect, useRef } from 'react';
import { Wrench, Battery, Cog, Plus, Search, X, Loader2, Radio, HelpCircle } from 'lucide-react';
import { apiFetch } from '@utils/api';
import Modal from '@shared/common/Modal';
import CustomDropdown from '@shared/common/CustomDropdown';

function Tooltip({ children, text }) {
    return (
        <div className="group relative inline-block">
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 whitespace-nowrap">
                <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text-primary)] shadow-xl whitespace-pre-line w-48 text-center">
                    {text}
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[var(--color-bg-elevated)] border-r border-b border-[var(--color-border)] rotate-45"></div>
                </div>
            </div>
        </div>
    );
}

export default function CreateLockEventModal({ onSave, onCancel, saving, initialRoomId = null, lockRoomSelection = false }) {
    const [rooms, setRooms] = useState([]);
    const [partTypes, setPartTypes] = useState([]);
    const [form, setForm] = useState({
        room_id: initialRoomId || '', type: 'battery', part_type_id: '', description: '',
        performed_at: new Date().toISOString().split('T')[0],
    });

    const [roomQuery, setRoomQuery] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(() => {
        if (!initialRoomId) return null;
        return null;
    });
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const inputRef = useRef(null);

    useEffect(() => {
        apiFetch('/api/structure/rooms?status=active')
            .then(d => setRooms(d.rooms || []));
        apiFetch('/api/maintenance/part-types')
            .then(d => {
                const activeParts = (d.part_types || []).filter(p => p.is_active !== false);
                setPartTypes(activeParts);
            });
    }, []);

    const filteredParts = partTypes.filter(p => p.category === form.type);
    const partOptions = filteredParts.map((p) => ({ value: String(p.id), label: p.name }));

    const suggestions = roomQuery.length > 0
        ? rooms
            .filter(r => r.room_number.includes(roomQuery))
            .sort((a, b) => {
                const aS = a.room_number.startsWith(roomQuery);
                const bS = b.room_number.startsWith(roomQuery);
                if (aS && !bS) return -1;
                if (!aS && bS) return 1;
                return a.room_number.localeCompare(b.room_number);
            })
            .slice(0, 8)
        : [];

    const handleRoomInput = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        setRoomQuery(val);
        setSelectedRoom(null);
        setForm(f => ({ ...f, room_id: '' }));
        setShowSuggestions(true);
        setActiveIdx(-1);
    };

    const selectRoom = (room) => {
        setSelectedRoom(room);
        setForm(f => ({ ...f, room_id: room.id }));
        setRoomQuery('');
        setShowSuggestions(false);
        setActiveIdx(-1);
    };

    const clearRoom = () => {
        setSelectedRoom(null);
        setForm(f => ({ ...f, room_id: '' }));
        setRoomQuery('');
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0) selectRoom(suggestions[activeIdx]); }
        if (e.key === 'Escape') { setShowSuggestions(false); }
    };

    const registrationTypes = [
        {
            value: 'battery',
            label: 'Cambio de Batería',
            icon: Battery,
            color: 'blue',
            helpText: 'Reinicia el 100% de vida útil de la batería. Se recalcula el próximo pronóstico.'
        },
        {
            value: 'mechanical',
            label: 'Reparación Mecánica',
            icon: Cog,
            color: 'orange',
            helpText: 'Reemplazo de piezas o reparaciones. No afecta la predicción de batería.'
        },
        {
            value: 'reprogramming',
            label: 'Reprogramación',
            icon: Radio,
            color: 'purple',
            helpText: 'Programación o reconfiguración de la cerradura. No afecta la predicción.'
        }
    ];

    const currentTypeInfo = registrationTypes.find(t => t.value === form.type);

    return (
        <Modal
            isOpen={true}
            onClose={onCancel}
            title="Registrar mantenimiento"
            icon={Wrench}
            size="md"
            footer={
                <div className="flex gap-3 w-full">
                    <button onClick={onCancel} className="flex-1 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave({
                            ...form,
                            room_id: parseInt(form.room_id),
                            part_type_id: form.part_type_id ? parseInt(form.part_type_id) : null,
                        })}
                        disabled={saving || !form.room_id}
                        className="flex-1 py-2 text-sm rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Registrar
                    </button>
                </div>
            }
        >
            <div className="space-y-4">

                <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Habitación</label>

                    {selectedRoom ? (
                        <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-lg">
                            <div>
                                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                                    Hab. {selectedRoom.room_number}
                                </span>
                                <span className="text-xs text-[var(--color-text-muted)] ml-2">
                                    {selectedRoom.module_name} · {selectedRoom.floor_code}
                                </span>
                            </div>
                            {!lockRoomSelection && (
                                <button
                                    onClick={clearRoom}
                                    className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ) : (
                        <div
                            className="relative"
                            onBlur={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget)) setShowSuggestions(false);
                            }}
                        >
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    inputMode="numeric"
                                    value={roomQuery}
                                    onChange={handleRoomInput}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => roomQuery && setShowSuggestions(true)}
                                    placeholder="Escribe el número de habitación…"
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                />
                            </div>
                            {showSuggestions && roomQuery.length > 0 && (
                                <div className="absolute z-20 mt-1 w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden">
                                    {suggestions.length > 0 ? (
                                        <ul>
                                            {suggestions.map((r, i) => (
                                                <li key={r.id}>
                                                    <button
                                                        tabIndex={0}
                                                        onMouseDown={(e) => { e.preventDefault(); selectRoom(r); }}
                                                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${i === activeIdx
                                                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                                            : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
                                                            }`}
                                                    >
                                                        <span className="font-medium">Hab. {r.room_number}</span>
                                                        <span className="text-xs text-[var(--color-text-muted)]">
                                                            {r.module_name} · {r.floor_code}
                                                        </span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="px-3 py-2.5 text-sm text-[var(--color-text-muted)]">
                                            Sin coincidencias para "{roomQuery}"
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 flex items-center gap-1">
                        Tipo de Registro
                        {currentTypeInfo && (
                            <Tooltip text={currentTypeInfo.helpText}>
                                <HelpCircle className="w-3.5 h-3.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-help" />
                            </Tooltip>
                        )}
                    </label>
                    <div className="flex gap-2">
                        {registrationTypes.map(opt => {
                            const Icon = opt.icon;
                            const active = form.type === opt.value;
                            const colorClasses = {
                                blue: active ? 'bg-blue-500/10 border-blue-500/40 text-blue-400' : 'hover:bg-blue-500/5',
                                orange: active ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'hover:bg-orange-500/5',
                                purple: active ? 'bg-purple-500/10 border-purple-500/40 text-purple-400' : 'hover:bg-purple-500/5',
                            };
                            return (
                                <button key={opt.value}
                                    onClick={() => setForm(f => ({ ...f, type: opt.value, part_type_id: '' }))}
                                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${active
                                        ? `${colorClasses[opt.color]} border-opacity-40 shadow-sm`
                                        : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${active ? 'opacity-100' : 'opacity-60'}`} />
                                    <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                                        {opt.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {!currentTypeInfo && (
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-2">Selecciona un tipo de registro para ver más información.</p>
                    )}
                </div>

                {form.type === 'mechanical' && (
                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Pieza</label>
                        <CustomDropdown
                            value={form.part_type_id ? String(form.part_type_id) : ''}
                            onChange={(value) => setForm((f) => ({ ...f, part_type_id: value }))}
                            options={partOptions}
                            placeholder="Seleccionar pieza"
                            emptyText="No hay piezas disponibles"
                            className="[&>button]:bg-[var(--color-bg-tertiary)]"
                        />
                    </div>
                )}

                <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Fecha</label>
                    <input
                        type="date"
                        value={form.performed_at}
                        onChange={e => setForm(f => ({ ...f, performed_at: e.target.value }))}
                        className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none [color-scheme:dark]"
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Descripción (opcional)</label>
                    <textarea
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={2}
                        placeholder="Detalles del mantenimiento..."
                        className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
                    />
                </div>
            </div>
        </Modal>
    );
}