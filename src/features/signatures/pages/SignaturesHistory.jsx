import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileSignature, Plus, Search, Trash2, Edit3,
    Mail, Phone, Briefcase, Calendar, Users,
    TrendingUp, AlertCircle, Loader2, X, ChevronRight
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
    return name
        .split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase();
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-VE', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

// Paleta de colores del avatar según índice (cíclica)
const AVATAR_COLORS = [
    { bg: '#009098', text: '#fff' },
    { bg: '#0f7681', text: '#fff' },
    { bg: '#1a5f7a', text: '#fff' },
    { bg: '#2d6a4f', text: '#fff' },
    { bg: '#6b4c9a', text: '#fff' },
    { bg: '#c75b39', text: '#fff' },
];

// ── Sub-componentes ───────────────────────────────────────────────────────────

function StatCard({ icon: StatIcon, label, value, color }) {
    return (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                        {label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold leading-none text-[var(--color-text-primary)]">
                        {value}
                    </p>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: `${color}16` }}>
                    <StatIcon className="h-5 w-5" style={{ color }} />
                </div>
            </div>
        </div>
    );
}

function EmptyState({ onNew }) {
    return (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                <FileSignature className="h-8 w-8 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-[var(--color-text-primary)]">No hay firmas guardadas</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
                Crea la primera firma para empezar a usar el historial y reutilizar datos en futuras ediciones.
            </p>
            <button
                onClick={onNew}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-light)]"
            >
                <Plus className="h-4 w-4" />
                Nueva firma
            </button>
        </div>
    );
}

function DeleteModal({ signature, onConfirm, onCancel, loading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6 shadow-2xl">
                <button onClick={onCancel} className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)]">
                    <X className="h-4 w-4" />
                </button>
                <div className="mb-5 flex items-start gap-4">
                    <div className="shrink-0 rounded-xl bg-red-500/10 p-3">
                        <Trash2 className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="mb-1 font-semibold text-[var(--color-text-primary)]">Eliminar firma</h3>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            ¿Eliminar la firma de <strong>{signature?.full_name}</strong>? Esta acción no se puede deshacer.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-xl border border-[var(--color-border)] py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-tertiary)]"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
function SignatureCard({ signature, colorData, onEdit, onDelete }) {
    const hasMobilePhone = Boolean(signature.mobile_phone);

    return (
        <article className="group overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30 hover:shadow-md">
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${colorData.bg}, transparent)` }} />

            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm"
                        style={{ background: colorData.bg, color: colorData.text }}
                    >
                        {getInitials(signature.full_name)}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                                    {signature.full_name}
                                </h3>
                                <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">
                                    {signature.job_title}
                                </p>
                            </div>

                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
                                <Calendar className="h-3 w-3 text-[var(--color-text-muted)]" />
                                {formatDate(signature.created_at)}
                            </span>
                        </div>

                        <div className="mt-3 grid gap-1.5 text-xs text-[var(--color-text-secondary)]">
                            <div className="flex items-center gap-2 rounded-lg bg-[var(--color-bg-tertiary)]/60 px-2.5 py-1.5">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
                                <span className="truncate">{signature.email}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2.5 py-1 text-[11px] text-[var(--color-text-secondary)]">
                                    <Phone className="h-3 w-3 text-[var(--color-text-muted)]" />
                                    {hasMobilePhone ? signature.mobile_phone : 'Sin móvil registrado'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                            <p className="text-[11px] text-[var(--color-text-muted)]">
                                #{signature.id}
                            </p>

                            <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                <button
                                    onClick={() => onEdit(signature)}
                                    className="inline-flex items-center justify-center rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
                                    aria-label="Editar firma"
                                    title="Editar firma"
                                >
                                    <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => onDelete(signature)}
                                    className="inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300"
                                    aria-label="Eliminar firma"
                                    title="Eliminar firma"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function SignaturesHistory() {
    const navigate = useNavigate();

    const [signatures, setSignatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchSignatures = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/signatures', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Error al cargar las firmas');
            const data = await res.json();
            setSignatures(data.signatures || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSignatures(); }, [fetchSignatures]);

    const handleDelete = async () => {
        if (!toDelete) return;
        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/signatures/${toDelete.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setSignatures(prev => prev.filter(s => s.id !== toDelete.id));
            setToDelete(null);
        } catch {
            // mantener modal abierto en caso de error
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = (sig) => {
        const params = new URLSearchParams({
            id: sig.id,
            fullName: sig.full_name,
            jobTitle: sig.job_title,
            email: sig.email,
            mobilePhone: sig.mobile_phone || '',
            extension: sig.extension || '',
        });
        navigate(`/signatures/new?${params.toString()}`);
    };

    // Stats
    const thisMonth = signatures.filter(s => {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const withMobilePhone = signatures.filter(s => Boolean(s.mobile_phone)).length;

    // Filtered list
    const filtered = signatures.filter(s => {
        const q = search.toLowerCase();
        return (
            s.full_name.toLowerCase().includes(q) ||
            s.job_title.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q)
        );
    });

    const visibleSignatures = [...filtered].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <div className="py-5 w-full px-5">
            <div className="mx-auto max-w-auto space-y-4">
                <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
                    <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="grid w-full grid-cols-3 gap-2 lg:flex-1">
                                <StatCard icon={Users} label="Firmas totales" value={signatures.length} color="#009098" />
                                <StatCard icon={TrendingUp} label="Este mes" value={thisMonth} color="#0f7681" />
                                <StatCard icon={Phone} label="Con móvil" value={withMobilePhone} color="#1a5f7a" />
                        </div>

                        <div className="flex w-full items-center gap-3 lg:w-auto lg:shrink-0">
                            {signatures.length > 0 && (
                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Buscar por nombre, cargo..."
                                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-2.5 pl-10 pr-10 text-sm text-[var(--color-text-primary)] transition-colors focus:border-[var(--color-primary)] focus:outline-none"
                                    />
                                    {search && (
                                        <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]">
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => navigate('/signatures/new')}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-light)]"
                            >
                                <Plus className="h-4 w-4" />
                                Nueva firma
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── Content ── */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                        <p className="text-[var(--color-text-secondary)] text-sm">{error}</p>
                        <button onClick={fetchSignatures} className="text-sm text-[var(--color-primary)] hover:underline">
                            Reintentar
                        </button>
                    </div>
                ) : signatures.length === 0 ? (
                    <EmptyState onNew={() => navigate('/signatures/new')} />
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-16 text-center text-sm text-[var(--color-text-secondary)] shadow-sm">
                        Sin resultados para <strong>"{search}"</strong>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {visibleSignatures.map((sig, idx) => (
                            <SignatureCard
                                key={sig.id}
                                signature={sig}
                                colorData={AVATAR_COLORS[idx % AVATAR_COLORS.length]}
                                onEdit={handleEdit}
                                onDelete={setToDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modal confirmación eliminar ── */}
            {toDelete && (
                <DeleteModal
                    signature={toDelete}
                    onConfirm={handleDelete}
                    onCancel={() => setToDelete(null)}
                    loading={deleting}
                />
            )}
        </div>
    );
}
