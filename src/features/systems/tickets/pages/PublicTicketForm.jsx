import React, { useState } from 'react';
import { Ticket, Send, CheckCircle } from 'lucide-react';
import { apiJson } from '@utils/api';

const CATEGORIES = [
    { value: '', label: 'Selecciona una categoría' },
    { value: 'hardware', label: 'Hardware (PC, impresora, monitor, etc.)' },
    { value: 'software', label: 'Software (Programas, sistema, errores)' },
    { value: 'conectividad', label: 'Conectividad (Internet, WiFi, red, teléfono)' },
    { value: 'otro', label: 'Otro' },
];

const PRIORITIES = [
    { value: 'baja', label: 'Baja — No urge, puede esperar' },
    { value: 'media', label: 'Media — Afecta parcialmente' },
    { value: 'alta', label: 'Alta — Afecta el trabajo' },
    { value: 'urgente', label: 'Urgente — Detiene operaciones' },
];

export default function PublicTicketForm() {
    const [form, setForm] = useState({
        submitted_by_name: '',
        submitted_by_department: '',
        submitted_by_contact: '',
        pc_location: '',
        category: '',
        title: '',
        description: '',
        priority: 'media',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.submitted_by_name || !form.category || !form.title || !form.description) {
            setError('Completa los campos obligatorios: Nombre, Categoría, Título y Descripción.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson('/api/tickets/public', {
                method: 'POST',
                body: form,
            });
            setSuccess(data.ticket);
        } catch (err) {
            setError(err.message || 'Error al enviar el ticket');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-4">
                <div className="w-full max-w-md bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Ticket Enviado</h2>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                        Tu ticket ha sido registrado. El equipo de Sistemas lo revisará pronto.
                    </p>
                    <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border)] mb-6">
                        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Número de Ticket</p>
                        <p className="text-2xl font-bold text-[var(--color-primary)] font-mono">{success.ticket_number}</p>
                    </div>
                    <button
                        onClick={() => { setSuccess(null); setForm({ submitted_by_name: '', submitted_by_department: '', submitted_by_contact: '', pc_location: '', category: '', title: '', description: '', priority: 'media' }); }}
                        className="w-full py-2.5 text-sm rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium transition-colors"
                    >
                        Enviar otro ticket
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] p-4">
            <div className="w-full max-w-lg mx-auto">
                <div className="text-center mb-8 pt-8">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <div
                            className="flex items-center justify-center bg-[var(--color-primary)] rounded-md overflow-hidden"
                            style={{ height: 32, padding: '0 10px 0 6px' }}
                        >
                            <img
                                src="/img/logo-hmr-main-white-.png"
                                alt="Hotel Margarita Real"
                                className="h-5 w-auto"
                                style={{ maxWidth: 130 }}
                            />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center justify-center gap-2">
                        <Ticket className="w-6 h-6 text-[var(--color-primary)]" />
                        Soporte Técnico
                    </h1>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                        Reporta cualquier problema técnico. El equipo de Sistemas lo atenderá.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl shadow-sm p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Nombre *</label>
                        <input
                            type="text"
                            name="submitted_by_name"
                            value={form.submitted_by_name}
                            onChange={handleChange}
                            placeholder="Tu nombre completo"
                            required
                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Departamento / Área</label>
                            <input
                                type="text"
                                name="submitted_by_department"
                                value={form.submitted_by_department}
                                onChange={handleChange}
                                placeholder="Ej: Recepción, Ventas"
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Contacto (Ext. / Celular)</label>
                            <input
                                type="text"
                                name="submitted_by_contact"
                                value={form.submitted_by_contact}
                                onChange={handleChange}
                                placeholder="Ext. 1001"
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Ubicación del equipo</label>
                        <input
                            type="text"
                            name="pc_location"
                            value={form.pc_location}
                            onChange={handleChange}
                            placeholder="Ej: Recepción - Mostrador 1"
                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Categoría *</label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.value} value={c.value} disabled={!c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Prioridad</label>
                            <select
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                {PRIORITIES.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Título del problema *</label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="Describe el problema en pocas palabras"
                            required
                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Descripción detallada *</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Explica qué sucede, desde cuándo, y cualquier detalle relevante..."
                            rows="4"
                            required
                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 text-sm rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        <Send className="w-4 h-4" />
                        {loading ? 'Enviando...' : 'Enviar Ticket'}
                    </button>
                </form>
            </div>
        </div>
    );
}
