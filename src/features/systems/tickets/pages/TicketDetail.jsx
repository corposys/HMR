import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Send, User, MapPin, Calendar,
    AlertTriangle, CheckCircle, XCircle, MessageSquare,
    RefreshCw, Shield, Layers, Ticket, Trash2
} from 'lucide-react';
import { useToast } from '@context/ToastContext';
import { apiJson } from '@utils/api';
import PageWrapper from '@shared/common/PageWrapper';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import ErrorState from '@shared/common/ErrorState';
import CustomDropdown from '@shared/common/CustomDropdown';
import Button from '@shared/common/Button';
import { usePermissions } from '@hooks/usePermissions';
import { Card } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const STATUS_OPTIONS = [
    { value: 'open', label: 'Pendiente' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'resolved', label: 'Resuelto' },
    { value: 'closed', label: 'Cerrado' },
];

const PRIORITY_OPTIONS = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' },
];

const CATEGORY_OPTIONS = [
    { value: 'hardware', label: 'Hardware' },
    { value: 'software', label: 'Software' },
    { value: 'conectividad', label: 'Conectividad' },
    { value: 'otro', label: 'Otro' },
];

const PRIORITY_COLORS = {
    urgente: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    alta: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    media: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    baja: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
};

const STATUS_COLORS = {
    open: 'bg-red-500/10 text-red-600 dark:text-red-400',
    in_progress: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    resolved: 'bg-green-500/10 text-green-600 dark:text-green-400',
    closed: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
};

const STATUS_LABELS = { open: 'Pendiente', in_progress: 'En Progreso', resolved: 'Resuelto', closed: 'Cerrado' };
const PRIORITY_LABELS = { urgente: 'Urgente', alta: 'Alta', media: 'Media', baja: 'Baja' };
const CATEGORY_LABELS = { hardware: 'Hardware', software: 'Software', conectividad: 'Conectividad', otro: 'Otro' };

export default function TicketDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { isAdmin } = usePermissions();

    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newComment, setNewComment] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [users, setUsers] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchTicket = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson(`/api/tickets/${id}`);
            setTicket(data.ticket);
            setComments(data.ticket.comments || []);
        } catch (err) {
            setError(err.message || 'Error al cargar el ticket');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTicket();
    }, [fetchTicket]);

    useEffect(() => {
        apiJson('/api/users/assignable')
            .then((data) => setUsers(data.users || []))
            .catch(() => setUsers([]));
    }, []);

    const handleUpdate = async (field, value, successLabel) => {
        try {
            await apiJson(`/api/tickets/${id}`, { method: 'PUT', body: { [field]: value } });
            if (successLabel) {
                showToast({ title: 'Actualizado', message: successLabel, type: 'success' });
            }
            await fetchTicket();
        } catch (err) {
            showToast({ title: 'Error', message: err.message, type: 'error' });
        }
    };

    const handleStatusChange = (newStatus) => handleUpdate('status', newStatus, `Estado: ${STATUS_LABELS[newStatus]}`);
    const handlePriorityChange = (newPriority) => handleUpdate('priority', newPriority, `Prioridad: ${PRIORITY_LABELS[newPriority]}`);
    const handleCategoryChange = (newCategory) => handleUpdate('category', newCategory, `Categoría: ${CATEGORY_LABELS[newCategory]}`);
    const handleAssigneeChange = (newUserId) => {
        const value = newUserId === '__unassigned' ? null : Number(newUserId);
        const label = value ? users.find((u) => u.id === value)?.full_name || 'usuario' : 'Sin asignar';
        handleUpdate('assigned_to', value, `Asignado a ${label}`);
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmitting(true);
        try {
            await apiJson(`/api/tickets/${id}/comments`, {
                method: 'POST',
                body: { comment_text: newComment, is_internal: isInternal },
            });
            setNewComment('');
            setIsInternal(false);
            showToast({ title: 'Comentario enviado', message: 'El comentario se agregó al ticket.', type: 'success' });
            await fetchTicket();
        } catch (err) {
            showToast({ title: 'Error', message: err.message, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await apiJson(`/api/tickets/${id}`, { method: 'DELETE' });
            showToast({ title: 'Ticket eliminado', message: 'El ticket fue eliminado.', type: 'success' });
            navigate('/systems/tickets');
        } catch (err) {
            showToast({ title: 'Error', message: err.message, type: 'error' });
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return <PageWrapper><div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div></PageWrapper>;
    }

    if (error) {
        return <PageWrapper><ErrorState message={error} onRetry={fetchTicket} /></PageWrapper>;
    }

    if (!ticket) return null;

    const assigneeOptions = [
        { value: '__unassigned', label: 'Sin asignar' },
        ...users.map((u) => ({ value: String(u.id), label: u.full_name })),
    ];

    return (
        <PageWrapper>
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <button
                        onClick={() => navigate('/systems/tickets')}
                        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Tickets
                    </button>
                    {isAdmin && (
                        <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => setConfirmDelete(true)}
                        >
                            Eliminar ticket
                        </Button>
                    )}
                </div>

                <Card className="p-6 bg-[var(--color-bg-secondary)] border-[var(--color-border)]">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-sm font-bold text-[var(--color-primary)]">{ticket.ticket_number}</span>
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ticket.status] || ''}`}>
                                        {STATUS_LABELS[ticket.status]}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${PRIORITY_COLORS[ticket.priority] || ''}`}>
                                        {PRIORITY_LABELS[ticket.priority]}
                                    </span>
                                </div>
                                <h1 className="text-lg font-bold text-[var(--color-text-primary)]">{ticket.title}</h1>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <CustomDropdown
                                    value={ticket.status}
                                    onChange={handleStatusChange}
                                    options={STATUS_OPTIONS}
                                    placeholder="Estado"
                                    className="min-w-[140px]"
                                    buttonClassName="h-8 text-xs"
                                />
                                <CustomDropdown
                                    value={ticket.priority}
                                    onChange={handlePriorityChange}
                                    options={PRIORITY_OPTIONS}
                                    placeholder="Prioridad"
                                    className="min-w-[120px]"
                                    buttonClassName="h-8 text-xs"
                                />
                                <button
                                    type="button"
                                    onClick={fetchTicket}
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                                    title="Recargar"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
                                <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Categoría</div>
                                <CustomDropdown
                                    value={ticket.category}
                                    onChange={handleCategoryChange}
                                    options={CATEGORY_OPTIONS}
                                    placeholder="Categoría"
                                    buttonClassName="h-7 text-xs !p-0 !bg-transparent !border-0 !text-[var(--color-text-primary)] font-semibold"
                                />
                            </div>
                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
                                <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5">Solicitante</div>
                                <div className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                                    {ticket.submitted_by_name}
                                </div>
                            </div>
                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
                                <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5">Ubicación</div>
                                <div className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                                    {ticket.pc_location || ticket.submitted_by_department || '—'}
                                </div>
                            </div>
                            <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
                                <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Asignado</div>
                                <CustomDropdown
                                    value={ticket.assigned_to ? String(ticket.assigned_to) : '__unassigned'}
                                    onChange={handleAssigneeChange}
                                    options={assigneeOptions}
                                    placeholder="Sin asignar"
                                    buttonClassName="h-7 text-xs !p-0 !bg-transparent !border-0 !text-[var(--color-text-primary)] font-semibold"
                                />
                            </div>
                        </div>

                        {(ticket.submitted_by_department || ticket.submitted_by_contact) && (
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                                {ticket.submitted_by_department && <span>Área: <strong className="text-[var(--color-text-primary)]">{ticket.submitted_by_department}</strong></span>}
                                {ticket.submitted_by_contact && <span>Contacto: <strong className="text-[var(--color-text-primary)]">{ticket.submitted_by_contact}</strong></span>}
                                {ticket.pc_location && <span>Equipo: <strong className="text-[var(--color-text-primary)]">{ticket.pc_location}</strong></span>}
                            </div>
                        )}

                        <div className="flex items-center gap-4 text-[11px] text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Creado: {formatDate(ticket.created_at)}</span>
                            {ticket.resolved_at && (
                                <span className="flex items-center gap-1 text-green-500"><CheckCircle className="w-3 h-3" /> Resuelto: {formatDate(ticket.resolved_at)}</span>
                            )}
                        </div>

                        <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
                            <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">{ticket.description}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-[var(--color-bg-secondary)] border-[var(--color-border)]">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-5 h-5 text-[var(--color-primary)]" />
                        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Comentarios</h2>
                        <span className="text-xs text-[var(--color-text-muted)] ml-1">({comments.length})</span>
                    </div>

                    {comments.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-[var(--color-border)] rounded-lg">
                            <MessageSquare className="w-8 h-8 mx-auto text-[var(--color-text-muted)] mb-2 opacity-50" />
                            <p className="text-sm text-[var(--color-text-secondary)]">Sin comentarios aún</p>
                        </div>
                    ) : (
                        <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                            {comments.map(comment => (
                                <div
                                    key={comment.id}
                                    className={`p-3 rounded-lg border ${comment.is_internal ? 'bg-amber-500/5 border-amber-500/20' : 'bg-[var(--color-bg-tertiary)] border-[var(--color-border)]'}`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                                                {comment.user_full_name || comment.author_name}
                                            </span>
                                            {comment.is_internal && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                                    Interno
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-[var(--color-text-muted)]">{formatDate(comment.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">{comment.comment_text}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <form onSubmit={handleSubmitComment} className="space-y-3">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe un comentario..."
                            rows="3"
                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
                        />
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isInternal}
                                    onChange={(e) => setIsInternal(e.target.checked)}
                                    className="w-3.5 h-3.5 rounded border-[var(--color-border)] text-amber-500 focus:ring-amber-500"
                                />
                                <span className="flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Comentario interno (solo visible para IT)
                                </span>
                            </label>
                            <button
                                type="submit"
                                disabled={submitting || !newComment.trim()}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium transition-colors disabled:opacity-60"
                            >
                                <Send className="w-3.5 h-3.5" />
                                {submitting ? 'Enviando...' : 'Enviar'}
                            </button>
                        </div>
                    </form>
                </Card>
            </div>

            <Dialog open={confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(false); }}>
                <DialogContent className="bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-400" />
                            Eliminar ticket
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        ¿Eliminar el ticket <strong>{ticket.ticket_number}</strong>? Esta acción no se puede deshacer.
                    </p>
                    <DialogFooter className="gap-2">
                        <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDelete} loading={deleting} icon={Trash2}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageWrapper>
    );
}
