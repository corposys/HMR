import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Plus, Search, X, Loader2, AlertTriangle, Home, Wrench, Shield, CheckCircle, Copy } from 'lucide-react';
import { apiFetch } from '@utils/api';
import Modal from '@shared/common/Modal';

export default function ReportModal({ onSave, onCancel, saving }) {
    const [rooms, setRooms] = useState([]);
    const [reports, setReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [form, setForm] = useState({
        room_id: '',
        report_type: 'lock_failure',
        issue_description: '',
        source_department: 'reception',
    });
    const [roomQuery, setRoomQuery] = useState('');
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIdx, setActiveIdx] = useState(-1);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    useEffect(() => {
        apiFetch('/api/structure/rooms?status=active')
            .then(d => setRooms(d.rooms || []));
        loadPendingReports();
    }, []);

    const loadPendingReports = async () => {
        setLoadingReports(true);
        try {
            const data = await apiFetch('/api/maintenance/reports?status=pending');
            setReports(data.reports || []);
        } catch (err) {
            console.error('Error loading reports:', err);
        } finally {
            setLoadingReports(false);
        }
    };

    const hasInitializedRoom = useRef(false);
    useEffect(() => {
        if (hasInitializedRoom.current) return;
    }, []);

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

    const isRoomReported = (roomId) => {
        return reports.some(r => r.room_id === roomId && r.status === 'pending');
    };

    const handleRoomInput = (e) => {
        const val = e.target.value.replace(/\D/g, '');
        setRoomQuery(val);
        setSelectedRoom(null);
        setForm(f => ({ ...f, room_id: '' }));
        setShowSuggestions(true);
        setActiveIdx(-1);
        setError(null);
    };

    const selectRoom = (room) => {
        const existing = isRoomReported(room.id);
        if (existing) {
            setError('Ya existe un reporte activo para esta habitación');
            return;
        }
        setSelectedRoom(room);
        setForm(f => ({ ...f, room_id: room.id }));
        setRoomQuery('');
        setShowSuggestions(false);
        setActiveIdx(-1);
        setError(null);
    };

    const clearRoom = () => {
        setSelectedRoom(null);
        setForm(f => ({ ...f, room_id: '' }));
        setRoomQuery('');
        setError(null);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
        if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
        if (e.key === 'Enter') { e.preventDefault(); if (activeIdx >= 0) selectRoom(suggestions[activeIdx]); }
        if (e.key === 'Escape') { setShowSuggestions(false); }
    };

    const reportTypes = [
        { value: 'lock_failure', label: 'Falla de cerradura', icon: AlertCircle, color: 'red' },
        { value: 'room_issue', label: 'Problema de habitación', icon: Home, color: 'orange' },
        { value: 'equipment_issue', label: 'Equipo dañado', icon: Wrench, color: 'amber' },
        { value: 'other', label: 'Otro', icon: AlertTriangle, color: 'gray' },
    ];

    const departments = [
        { value: 'reception', label: 'Recepción' },
        { value: 'housekeeping', label: 'Housekeeping' },
        { value: 'maintenance', label: 'Mantenimiento' },
        { value: 'systems', label: 'Sistemas' },
    ];

    return (
        <Modal
            isOpen={true}
            onClose={onCancel}
            title="Reportar incidencia"
            icon={AlertCircle}
            size="md"
            footer={
                <div className="flex gap-3 w-full">
                    <button onClick={onCancel} className="flex-1 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={async () => {
                            if (!form.room_id || !form.issue_description.trim()) {
                                setError('Completa todos los campos requeridos');
                                return;
                            }
                            setError(null);
                            onSave({
                                ...form,
                                room_id: parseInt(form.room_id),
                            });
                        }}
                        disabled={saving || !form.room_id || !form.issue_description.trim()}
                        className="flex-1 py-2 text-sm rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Reportar
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                {loadingReports ? (
                    <div className="text-center py-4 text-sm text-[var(--color-text-muted)]">Cargando...</div>
                ) : reports.length > 0 && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Reportes activos: {reports.length}</span>
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                            {reports.map((r) => (
                                <div key={r.id} className="flex items-center justify-between text-xs">
                                    <span className="text-[var(--color-text-primary)]">Hab. {r.room_number}</span>
                                    <span className="text-[var(--color-text-muted)]">{r.report_type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

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
                            <button
                                onClick={clearRoom}
                                className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
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
                                            {suggestions.map((r, i) => {
                                                const alreadyReported = isRoomReported(r.id);
                                                return (
                                                    <li key={r.id}>
                                                        <button
                                                            tabIndex={0}
                                                            onMouseDown={(e) => { e.preventDefault(); if (!alreadyReported) selectRoom(r); }}
                                                            className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${alreadyReported
                                                                ? 'text-[var(--color-text-muted)] cursor-not-allowed opacity-50'
                                                                : i === activeIdx
                                                                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                                                    : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
                                                                }`}
                                                        >
                                                            <span className="font-medium">Hab. {r.room_number}</span>
                                                            <span className="text-xs text-[var(--color-text-muted)]">
                                                                {r.module_name} · {r.floor_code}
                                                            </span>
                                                            {alreadyReported && (
                                                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Ya reportado</span>
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
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
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">
                        Tipo de reporte
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {reportTypes.map(opt => {
                            const Icon = opt.icon;
                            const active = form.report_type === opt.value;
                            return (
                                <button key={opt.value}
                                    onClick={() => setForm(f => ({ ...f, report_type: opt.value }))}
                                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${active
                                        ? `bg-${opt.color}-500/10 border-${opt.color}-500/40 text-${opt.color}-400 shadow-sm`
                                        : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${active ? 'opacity-100' : 'opacity-60'}`} />
                                    <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                                        {opt.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">
                        Departamento origen
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {departments.map(opt => {
                            const active = form.source_department === opt.value;
                            return (
                                <button key={opt.value}
                                    onClick={() => setForm(f => ({ ...f, source_department: opt.value }))}
                                    className={`p-3 rounded-xl border transition-all text-center ${active
                                        ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/40 text-[var(--color-primary)] shadow-sm'
                                        : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                                    }`}
                                >
                                    <span className={`text-xs ${active ? 'font-semibold' : 'font-medium'}`}>
                                        {opt.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">
                        Descripción del problema
                    </label>
                    <textarea
                        value={form.issue_description}
                        onChange={e => setForm(f => ({ ...f, issue_description: e.target.value }))}
                        rows={3}
                        placeholder="Describe el problema reportado..."
                        className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
                    />
                </div>
            </div>
        </Modal>
    );
}