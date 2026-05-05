import { useState, useEffect, useCallback } from 'react';
import {
    BookOpen, Plus, AlertTriangle, CheckCircle, Clock, Filter,
    Sun, Sunset, Moon, Bell, X, Trash2, Edit3, MessageSquare,
} from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import Button from '@shared/common/Button';
import Badge from '@shared/common/Badge';
import Input from '@shared/common/Input';
import Modal from '@shared/common/Modal';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import { apiFetch, apiJson } from '@utils/api';
import { formatDateTime } from '@utils/formatters';

const SHIFT_OPTIONS = [
    { value: 'morning', label: 'Mañana', icon: Sun },
    { value: 'afternoon', label: 'Tarde', icon: Sunset },
    { value: 'night', label: 'Noche', icon: Moon },
];

const TYPE_OPTIONS = [
    { value: 'note', label: 'Nota' },
    { value: 'alert', label: 'Alerta' },
    { value: 'reminder', label: 'Recordatorio' },
];

const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Baja' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
];

const TYPE_VARIANTS = {
    note: 'info',
    alert: 'warning',
    reminder: 'primary',
};

const PRIORITY_COLORS = {
    low: 'text-gray-400',
    normal: 'text-blue-400',
    high: 'text-amber-400',
    urgent: 'text-red-400',
};

export default function LogbookPage() {
    const [notes, setNotes] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [filterShift, setFilterShift] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterResolved, setFilterResolved] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [editingNote, setEditingNote] = useState(null);
    const [form, setForm] = useState({
        shift: 'morning',
        note_type: 'note',
        priority: 'normal',
        content: '',
        is_alert: false,
    });
    const [submitting, setSubmitting] = useState(false);

    const fetchNotes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (filterShift) params.set('shift', filterShift);
            if (filterType) params.set('note_type', filterType);
            if (filterResolved === 'resolved') params.set('is_resolved', 'true');
            if (filterResolved === 'unresolved') params.set('is_resolved', 'false');
            const qs = params.toString();
            const data = await apiFetch(`/api/reception/logbook${qs ? `?${qs}` : ''}`);
            setNotes(data.notes || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filterShift, filterType, filterResolved]);

    const fetchAlerts = useCallback(async () => {
        try {
            const data = await apiFetch('/api/reception/logbook/alerts');
            setAlerts(data.alerts || []);
        } catch {
            setAlerts([]);
        }
    }, []);

    useEffect(() => {
        fetchNotes();
        fetchAlerts();
    }, [fetchNotes, fetchAlerts]);

    const openCreate = () => {
        setEditingNote(null);
        setForm({ shift: 'morning', note_type: 'note', priority: 'normal', content: '', is_alert: false });
        setShowForm(true);
        setError(null);
    };

    const openEdit = (note) => {
        setEditingNote(note);
        setForm({
            shift: note.shift,
            note_type: note.note_type,
            priority: note.priority,
            content: note.content,
            is_alert: note.is_alert,
        });
        setShowForm(true);
        setError(null);
    };

    const handleSubmit = async () => {
        if (!form.content.trim()) return;
        setSubmitting(true);
        try {
            if (editingNote) {
                await apiJson(`/api/reception/logbook/${editingNote.id}`, {
                    method: 'PATCH',
                    body: { content: form.content, priority: form.priority },
                });
            } else {
                await apiJson('/api/reception/logbook', {
                    method: 'POST',
                    body: form,
                });
            }
            setShowForm(false);
            fetchNotes();
            fetchAlerts();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolve = async (note) => {
        try {
            await apiJson(`/api/reception/logbook/${note.id}`, {
                method: 'PATCH',
                body: { is_resolved: !note.is_resolved },
            });
            fetchNotes();
            fetchAlerts();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (noteId) => {
        if (!window.confirm('¿Eliminar esta nota permanentemente?')) return;
        try {
            await apiFetch(`/api/reception/logbook/${noteId}`, { method: 'DELETE' });
            fetchNotes();
            fetchAlerts();
        } catch (err) {
            setError(err.message);
        }
    };

    const getShiftIcon = (shift) => {
        const cfg = SHIFT_OPTIONS.find(s => s.value === shift);
        return cfg?.icon || Sun;
    };

    return (
        <PageWrapper title="Libro de Novedades" subtitle="Bitácora de turnos y alertas" icon={BookOpen}>
            <div className="space-y-4">
                {/* Alerts banner */}
                {alerts.length > 0 && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-red-400">
                            <Bell className="w-4 h-4" />
                            Alertas activas ({alerts.length})
                        </div>
                        <div className="space-y-1.5">
                            {alerts.slice(0, 3).map(alert => (
                                <div key={alert.id} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                    <span>{alert.content}</span>
                                    {alert.room_number && (
                                        <span className="text-[var(--color-text-muted)]">(Hab. {alert.room_number})</span>
                                    )}
                                </div>
                            ))}
                            {alerts.length > 3 && (
                                <p className="text-xs text-[var(--color-text-muted)]">+ {alerts.length - 3} más...</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Filters + Create */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                        <select className="input text-sm" value={filterShift} onChange={e => setFilterShift(e.target.value)}>
                            <option value="">Todos los turnos</option>
                            {SHIFT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <select className="input text-sm" value={filterType} onChange={e => setFilterType(e.target.value)}>
                            <option value="">Todos los tipos</option>
                            {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <select className="input text-sm" value={filterResolved} onChange={e => setFilterResolved(e.target.value)}>
                            <option value="">Todas</option>
                            <option value="unresolved">Pendientes</option>
                            <option value="resolved">Resueltas</option>
                        </select>
                    </div>
                    <div className="ml-auto">
                        <Button variant="primary" size="sm" icon={Plus} onClick={openCreate}>
                            Nueva nota
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        {notes.map(note => {
                            const ShiftIcon = getShiftIcon(note.shift);
                            return (
                                <div
                                    key={note.id}
                                    className={`rounded-xl border p-4 transition-colors ${
                                        note.is_alert && !note.is_resolved
                                            ? 'border-red-500/20 bg-red-500/5'
                                            : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant={TYPE_VARIANTS[note.note_type] || 'info'}>
                                                {TYPE_OPTIONS.find(t => t.value === note.note_type)?.label || note.note_type}
                                            </Badge>
                                            <span className={`text-xs font-medium ${PRIORITY_COLORS[note.priority] || ''}`}>
                                                {PRIORITY_OPTIONS.find(p => p.value === note.priority)?.label}
                                            </span>
                                            <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                                                <ShiftIcon className="w-3 h-3" />
                                                {SHIFT_OPTIONS.find(s => s.value === note.shift)?.label}
                                            </div>
                                            {note.is_resolved && (
                                                <Badge variant="success" className="text-[10px]">Resuelta</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleResolve(note)}
                                                className={`p-1 rounded transition-colors ${note.is_resolved ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-[var(--color-text-muted)] hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                                                title={note.is_resolved ? 'Marcar pendiente' : 'Marcar resuelta'}
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openEdit(note)}
                                                className="p-1 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className="p-1 rounded text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-[var(--color-text-primary)] mt-2">{note.content}</p>

                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--color-text-muted)]">
                                        <span>Por {note.author_name || '—'}</span>
                                        <span>{formatDateTime(note.created_at)}</span>
                                    </div>
                                </div>
                            );
                        })}

                        {notes.length === 0 && (
                            <div className="flex items-center justify-center h-64 text-[var(--color-text-muted)]">
                                <div className="text-center">
                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-lg font-medium">Sin notas</p>
                                    <p className="text-sm mt-1">Crea la primera nota de turno</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Form modal */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title={editingNote ? 'Editar nota' : 'Nueva nota de turno'}
                icon={BookOpen}
                size="md"
                footer={
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                        <Button variant="primary" icon={CheckCircle} loading={submitting} onClick={handleSubmit}>
                            {editingNote ? 'Guardar cambios' : 'Crear nota'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Turno</label>
                            <select className="input w-full text-sm" value={form.shift} onChange={e => setForm(p => ({ ...p, shift: e.target.value }))}>
                                {SHIFT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Tipo</label>
                            <select className="input w-full text-sm" value={form.note_type} onChange={e => setForm(p => ({ ...p, note_type: e.target.value, is_alert: e.target.value === 'alert' }))}>
                                {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Prioridad</label>
                            <select className="input w-full text-sm" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                                {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Contenido</label>
                        <textarea
                            className="input w-full text-sm min-h-[100px] resize-y"
                            placeholder="Describe la novedad..."
                            value={form.content}
                            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                        />
                    </div>
                </div>
            </Modal>
        </PageWrapper>
    );
}
