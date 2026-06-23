import React, { useState, useEffect, useRef } from 'react';
import { Wrench, Battery, Cog, Plus, Search, X, Loader2, Radio, Package, Trash2, Check } from 'lucide-react';
import { apiFetch } from '@utils/api';
import Modal from '@shared/common/Modal';
import CustomDropdown from '@shared/common/CustomDropdown';
import DateTimePicker from '@shared/common/DateTimePicker';

const TYPE_COLORS = {
    battery: { border: 'border-l-emerald-500', bg: 'bg-emerald-500/5', text: 'text-emerald-400', ring: 'border-emerald-500/20' },
    mechanical: { border: 'border-l-amber-500', bg: 'bg-amber-500/5', text: 'text-amber-400', ring: 'border-amber-500/20' },
    reprogramming: { border: 'border-l-purple-500', bg: 'bg-purple-500/5', text: 'text-purple-400', ring: 'border-purple-500/20' },
};

function SectionSeparator({ label }) {
    return (
        <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">{label}</span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
    );
}

export default function CreateLockEventModal({ onSave, onCancel, saving, initialRoomId = null, lockRoomSelection = false }) {
    const [rooms, setRooms] = useState([]);
    const [parts, setParts] = useState([]);
    const [form, setForm] = useState(() => {
        const now = new Date();
        const tzOffset = now.getTimezoneOffset();
        const local = new Date(now.getTime() - tzOffset * 60000);
        const defaultDatetime = local.toISOString().slice(0, 16);
        return {
            room_id: initialRoomId || '',
            description: '',
            performed_at: defaultDatetime,
        };
    });

    const [selectedTypes, setSelectedTypes] = useState({
        battery: false,
        mechanical: false,
        reprogramming: false,
    });

    const [mechanicalParts, setMechanicalParts] = useState([]);

    const [roomQuery, setRoomQuery] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const inputRef = useRef(null);

    useEffect(() => {
        apiFetch('/api/structure/rooms?status=active')
            .then(d => {
                const roomsData = d.rooms || [];
                setRooms(roomsData);
                if (initialRoomId) {
                    const match = roomsData.find(r => r.id === initialRoomId);
                    if (match) {
                        setSelectedRoom(match);
                        setForm(f => ({ ...f, room_id: initialRoomId }));
                    }
                }
            });
        apiFetch('/api/maintenance/part-types')
            .then(d => setParts(d.part_types || []));
    }, []);

    const batteryPart = parts.find(p => p.name === 'Batería AA');
    const batteryStock = batteryPart?.stock ?? 0;

    const partOptions = parts
        .filter(p => p.category !== 'consumible' || p.name.includes('Batería'))
        .map(p => ({ value: String(p.id), label: `${p.name} (${p.stock} disp.)` }));

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

    const toggleType = (type) => {
        setSelectedTypes(prev => ({ ...prev, [type]: !prev[type] }));
        if (type === 'mechanical' && !selectedTypes.mechanical && mechanicalParts.length === 0) {
            setMechanicalParts([{ part_type_id: '', quantity: 1 }]);
        }
    };

    const addPartLine = () => {
        setMechanicalParts(prev => [...prev, { part_type_id: '', quantity: 1 }]);
    };

    const removePartLine = (idx) => {
        setMechanicalParts(prev => prev.filter((_, i) => i !== idx));
    };

    const updatePartLine = (idx, field, value) => {
        setMechanicalParts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    };

    const registrationTypes = [
        {
            value: 'battery',
            label: 'Cambio de Baterías',
            subtitle: '4 baterías AA',
            icon: Battery,
        },
        {
            value: 'mechanical',
            label: 'Reparación / Reemplazo Mecánico',
            subtitle: 'Piezas físicas',
            icon: Cog,
        },
        {
            value: 'reprogramming',
            label: 'Reprogramación',
            subtitle: 'Reconfiguración del sistema',
            icon: Radio,
        }
    ];

    const eventCount = Object.values(selectedTypes).filter(Boolean).length;
    const canSubmit = form.room_id && eventCount > 0;
    const submitLabel = eventCount > 0
        ? `Registrar ${eventCount} evento${eventCount > 1 ? 's' : ''}`
        : 'Registrar';

    const handleSubmit = () => {
        const events = [];
        if (selectedTypes.battery) {
            events.push({
                type: 'battery',
                parts: batteryPart ? [{ part_type_id: batteryPart.id, quantity: 4 }] : [],
            });
        }
        if (selectedTypes.mechanical) {
            const validParts = mechanicalParts.filter(p => p.part_type_id);
            events.push({
                type: 'mechanical',
                parts: validParts.map(p => ({
                    part_type_id: parseInt(p.part_type_id),
                    quantity: parseInt(p.quantity) || 1,
                })),
            });
        }
        if (selectedTypes.reprogramming) {
            events.push({ type: 'reprogramming', parts: [] });
        }

        onSave({
            room_id: parseInt(form.room_id),
            events,
            description: form.description || null,
            performed_at: form.performed_at ? form.performed_at + ':00' : form.performed_at,
        });
    };

    return (
        <Modal
            isOpen={true}
            onClose={onCancel}
            title="Registrar evento"
            icon={Wrench}
            size="lg"
            footer={
                <div className="flex gap-3 w-full">
                    <button onClick={onCancel} className="flex-1 py-2.5 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !canSubmit}
                        className="flex-1 py-2.5 text-sm rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {submitLabel}
                    </button>
                </div>
            }
        >
            <div className="space-y-5">

                <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Habitación</label>

                    {selectedRoom ? (
                        <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/30 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                                    <span className="text-sm font-bold text-[var(--color-primary)]">{selectedRoom.room_number}</span>
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-[var(--color-text-primary)] block">
                                        Habitación {selectedRoom.room_number}
                                    </span>
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        {selectedRoom.module_name} · {selectedRoom.floor_code}
                                    </span>
                                </div>
                            </div>
                            {!lockRoomSelection && (
                                <button
                                    onClick={clearRoom}
                                    className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                >
                                    <X className="w-4 h-4" />
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
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    inputMode="numeric"
                                    value={roomQuery}
                                    onChange={handleRoomInput}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => roomQuery && setShowSuggestions(true)}
                                    placeholder="Escribe el número de habitación…"
                                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
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
                                                        className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between transition-colors ${i === activeIdx
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

                <SectionSeparator label="¿Qué se hizo?" />

                <div className="space-y-3">
                    {registrationTypes.map(opt => {
                        const Icon = opt.icon;
                        const active = selectedTypes[opt.value];
                        const colors = TYPE_COLORS[opt.value];

                        return (
                            <div
                                key={opt.value}
                                className={`rounded-xl border border-l-4 transition-all overflow-hidden ${
                                    active
                                        ? `${colors.border} ${colors.ring} ${colors.bg}`
                                        : 'border-l-zinc-600 border-[var(--color-border)] bg-[var(--color-bg-secondary)]'
                                }`}
                            >
                                <button
                                    onClick={() => toggleType(opt.value)}
                                    className="w-full flex items-center gap-3 p-4 text-left transition-colors"
                                >
                                    <Icon className={`w-5 h-5 shrink-0 ${active ? colors.text : 'text-[var(--color-text-muted)]'}`} />
                                    <div className="flex-1 min-w-0">
                                        <span className={`text-sm block ${active ? 'font-semibold text-[var(--color-text-primary)]' : 'font-medium text-[var(--color-text-secondary)]'}`}>
                                            {opt.label}
                                        </span>
                                        <span className="text-xs text-[var(--color-text-muted)]">
                                            {opt.subtitle}
                                        </span>
                                    </div>
                                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                                        active
                                            ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
                                            : 'border-[var(--color-border)]'
                                    }`}>
                                        {active && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                </button>

                                {active && opt.value === 'battery' && (
                                    <div className="px-4 pb-4">
                                        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                                            <Package className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span className="text-xs text-[var(--color-text-secondary)]">
                                                Se descontarán <strong className="text-[var(--color-text-primary)]">4 baterías AA</strong> del stock
                                            </span>
                                            <span className={`ml-auto text-xs font-semibold ${batteryStock > 20 ? 'text-emerald-400' : batteryStock > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                                                {batteryStock} disp.
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {active && opt.value === 'mechanical' && (
                                    <div className="px-4 pb-4 space-y-2">
                                        {mechanicalParts.length > 0 && (
                                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold px-1">
                                                <span className="flex-1">Pieza</span>
                                                <span className="w-20 text-center">Cantidad</span>
                                                <span className="w-8" />
                                            </div>
                                        )}
                                        {mechanicalParts.map((partLine, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <CustomDropdown
                                                        value={partLine.part_type_id}
                                                        onChange={(val) => updatePartLine(idx, 'part_type_id', val)}
                                                        options={partOptions}
                                                        placeholder="Seleccionar pieza"
                                                        emptyText="No hay piezas disponibles"
                                                        className="[&>button]:bg-[var(--color-bg-secondary)] [&>button]:h-9 [&>button]:text-sm"
                                                    />
                                                </div>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={partLine.quantity}
                                                    onChange={(e) => updatePartLine(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-20 px-3 py-2 text-sm text-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                                                />
                                                {mechanicalParts.length > 1 && (
                                                    <button
                                                        onClick={() => removePartLine(idx)}
                                                        className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            onClick={addPartLine}
                                            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-light)] transition-colors font-medium pt-1"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Agregar otra pieza
                                        </button>
                                    </div>
                                )}

                                {active && opt.value === 'reprogramming' && (
                                    <div className="px-4 pb-4">
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            Programación o reconfiguración de la cerradura. No afecta stock ni predicción de batería.
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <SectionSeparator label="Detalles" />

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Fecha y Hora</label>
                        <DateTimePicker
                            value={form.performed_at}
                            onChange={(val) => setForm(f => ({ ...f, performed_at: val }))}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">Descripción (opcional)</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            rows={3}
                            placeholder="Detalles del mantenimiento realizado..."
                            className="w-full px-3 py-2.5 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
