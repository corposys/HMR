import { useState } from 'react';
import { Ticket, Send, X } from 'lucide-react';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import Button from '@shared/common/Button';
import { apiJson } from '@utils/api';
import { useToast } from '@context/ToastContext';

const CATEGORIES = [
    { value: '', label: 'Selecciona una categoría' },
    { value: 'hardware', label: 'Hardware (PC, impresora, monitor)' },
    { value: 'software', label: 'Software (Programas, sistema, errores)' },
    { value: 'conectividad', label: 'Conectividad (Internet, WiFi, red, teléfono)' },
    { value: 'otro', label: 'Otro' },
];

const PRIORITIES = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' },
];

const EMPTY = {
    category: '',
    title: '',
    description: '',
    priority: 'media',
    submitted_by_name: '',
    submitted_by_department: '',
    submitted_by_contact: '',
    pc_location: '',
};

export default function CreateTicketModal({ open, onClose, onCreated }) {
    const { showToast } = useToast();
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.category || !form.title || !form.description || !form.submitted_by_name) {
            showToast({
                type: 'warning',
                title: 'Datos incompletos',
                message: 'Completa categoría, título, descripción y nombre.',
            });
            return;
        }
        setLoading(true);
        try {
            const data = await apiJson('/api/tickets/public', {
                method: 'POST',
                body: form,
            });
            showToast({
                type: 'success',
                title: 'Ticket creado',
                message: `Ticket ${data.ticket?.ticket_number || ''} registrado.`,
            });
            setForm(EMPTY);
            onClose();
            onCreated?.();
        } catch (err) {
            showToast({
                type: 'error',
                title: 'Error',
                message: err.message || 'No se pudo crear el ticket.',
            });
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full px-3 py-2 text-sm rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors";

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
            <DialogContent className="bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-[var(--color-primary)]" />
                        Nuevo Ticket
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-[var(--color-text-secondary)]">Nombre del solicitante *</label>
                            <input
                                name="submitted_by_name"
                                value={form.submitted_by_name}
                                onChange={handleChange}
                                required
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-text-secondary)]">Departamento</label>
                            <input
                                name="submitted_by_department"
                                value={form.submitted_by_department}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-text-secondary)]">Contacto (extensión o tel.)</label>
                            <input
                                name="submitted_by_contact"
                                value={form.submitted_by_contact}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-text-secondary)]">Ubicación del equipo</label>
                            <input
                                name="pc_location"
                                value={form.pc_location}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-text-secondary)]">Categoría *</label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                required
                                className={inputClass}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-[var(--color-text-secondary)]">Prioridad</label>
                            <select
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-text-secondary)]">Título *</label>
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            required
                            className={inputClass}
                            placeholder="Resumen breve del problema"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--color-text-secondary)]">Descripción *</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            className={inputClass}
                            placeholder="Detalla el problema..."
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="secondary" type="button" onClick={onClose} icon={X}>Cancelar</Button>
                        <Button variant="primary" type="submit" icon={Send} loading={loading}>Crear Ticket</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
