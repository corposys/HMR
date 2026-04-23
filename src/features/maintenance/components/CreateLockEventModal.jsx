import React, { useState, useEffect, useRef } from 'react';
import { Wrench, Battery, Cog, Plus, Search, X, Loader2 } from 'lucide-react';
import CustomDropdown from '@shared/common/CustomDropdown';

export default function CreateLockEventModal({ onSave, onCancel, saving, initialRoomId = null, lockRoomSelection = false }) {
    const [rooms, setRooms] = useState([]);
    const [partTypes, setPartTypes] = useState([]);
    const [form, setForm] = useState({
        room_id: '', type: 'battery', part_type_id: '', description: '',
        performed_at: new Date().toISOString().split('T')[0],
    });

    // Room autocomplete state
    const [roomQuery, setRoomQuery] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const inputRef = useRef(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('/api/structure/rooms?status=active', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(d => setRooms(d.rooms || []));
        fetch('/api/maintenance/part-types', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(d => setPartTypes(d.part_types || []));
    }, []);

    useEffect(() => {
        if (!initialRoomId || rooms.length === 0) {
            return;
        }

        const initialRoom = rooms.find((room) => room.id === Number(initialRoomId));
        if (!initialRoom) {
            return;
        }

        setSelectedRoom(initialRoom);
        setForm((current) => ({ ...current, room_id: initialRoom.id }));
        setRoomQuery('');
        setShowSuggestions(false);
        setActiveIdx(-1);
    }, [initialRoomId, rooms]);

    const filteredParts = partTypes.filter(p => p.category === form.type);
    const partOptions = filteredParts.map((p) => ({ value: String(p.id), label: p.name }));

    // Live suggestions: exact prefix first, then contains, max 8
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
        const val = e.target.value.replace(/\D/g, ''); // digits only
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 w-full max-w-md z-10">
                <button onClick={onCancel} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                    <X className="w-4 h-4" />
                </button>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2  py-2">
                    <Wrench className="w-5 h-5 text-[var(--color-primary)]" />
                    Registrar Mantenimiento
                </h3>

                <div className="space-y-4">

                    {/* ── Room autocomplete ── */}
                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Habitación</label>

                        {selectedRoom ? (
                            /* Selected chip */
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
                            /* Search input + dropdown */
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

                    {/* ── Type & Info Box ── */}
                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">
                            Tipo de Registro
                        </label>
                        <div className="flex gap-2 mb-3">
                            {[
                                { value: 'battery', label: 'Cambio de Batería', icon: Battery },
                                { value: 'mechanical', label: 'Reparación Mecánica', icon: Cog },
                            ].map(opt => {
                                const Icon = opt.icon;
                                const active = form.type === opt.value;
                                return (
                                    <button key={opt.value}
                                        onClick={() => setForm(f => ({ ...f, type: opt.value, part_type_id: '' }))}
                                        className={`flex-1 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${active
                                            ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/40 text-[var(--color-primary)] shadow-sm'
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

                        {/* Informational Message based on type */}
                        {form.type === 'battery' && (
                            <div className="flex items-start gap-2.5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                <Battery className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] leading-relaxed text-blue-400">
                                    <span className="font-semibold block mb-0.5">Control Predictivo</span>
                                    Al procesar este registro, la vida útil estimada de la batería de esta habitación se reiniciará al 100% y se recalculará el próximo pronóstico de cambio.
                                </p>
                            </div>
                        )}
                        {form.type === 'mechanical' && (
                            <div className="flex items-start gap-2.5 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                <Cog className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] leading-relaxed text-orange-400">
                                    <span className="font-semibold block mb-0.5">Mantenimiento Mecánico</span>
                                    Registra el reemplazo de piezas o reparaciones en el mecanismo de la cerradura. Esto no afectará la predicción de batería.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Part type (mechanical only) ── */}
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

                    {/* ── Date ── */}
                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Fecha</label>
                        <input
                            type="date"
                            value={form.performed_at}
                            onChange={e => setForm(f => ({ ...f, performed_at: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none [color-scheme:dark]"
                        />
                    </div>

                    {/* ── Description ── */}
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

                <div className="flex gap-3 mt-5">
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
            </div>
        </div>
    );
}
