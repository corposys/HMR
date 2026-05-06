import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileSignature, Plus, Search, Trash2, Edit3,
    Mail, Phone, Users, TrendingUp, X
} from 'lucide-react';
import { useToast } from '@context/ToastContext';
import { formatDate } from '@utils/formatters';
import { apiFetch } from '@utils/api';
import StatCard from '@shared/common/StatCard';
import Modal from '@shared/common/Modal';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import ErrorState from '@shared/common/ErrorState';
import EmptyState from '@shared/common/EmptyState';
import PageWrapper from '@shared/common/PageWrapper';
import Button from '@shared/common/Button';

const AVATAR_COLORS = [
    { bg: '#009098', text: '#fff' },
    { bg: '#0f7681', text: '#fff' },
    { bg: '#1a5f7a', text: '#fff' },
    { bg: '#2d6a4f', text: '#fff' },
    { bg: '#6b4c9a', text: '#fff' },
    { bg: '#c75b39', text: '#fff' },
];

function getInitials(name) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
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
                                <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{signature.full_name}</h3>
                                <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">{signature.job_title}</p>
                            </div>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
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
                            <p className="text-[11px] text-[var(--color-text-muted)]">#{signature.id}</p>
                            <div className="flex items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                <button onClick={() => onEdit(signature)} className="inline-flex items-center justify-center rounded-lg border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20" aria-label="Editar firma" title="Editar firma">
                                    <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button onClick={() => onDelete(signature)} className="inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/15 hover:text-red-300" aria-label="Eliminar firma" title="Eliminar firma">
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

export default function SignaturesHistory() {
    const navigate = useNavigate();
    const { showToast } = useToast();

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
            const data = await apiFetch('/api/signatures');
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
            await apiFetch(`/api/signatures/${toDelete.id}`, { method: 'DELETE' });
            setSignatures(prev => prev.filter(s => s.id !== toDelete.id));
            setToDelete(null);
        } catch {
            showToast({ title: 'Error', message: 'No se pudo eliminar la firma', type: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = (sig) => {
        const params = new URLSearchParams({
            id: sig.id, fullName: sig.full_name, jobTitle: sig.job_title,
            email: sig.email, mobilePhone: sig.mobile_phone || '', extension: sig.extension || '',
        });
        navigate(`/systems/signatures/new?${params.toString()}`);
    };

    const thisMonth = signatures.filter(s => {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const withMobilePhone = signatures.filter(s => Boolean(s.mobile_phone)).length;

    const filtered = signatures.filter(s => {
        const q = search.toLowerCase();
        return s.full_name.toLowerCase().includes(q) || s.job_title.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    });

    const visibleSignatures = [...filtered].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <PageWrapper>
            <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
                <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="grid w-full grid-cols-3 gap-2 lg:flex-1">
                        <StatCard icon={Users} title="Firmas totales" value={signatures.length} iconClassName="text-[#009098]" iconBgClassName="bg-[#009098]/10" variant="primary" />
                        <StatCard icon={TrendingUp} title="Este mes" value={thisMonth} iconClassName="text-[#0f7681]" iconBgClassName="bg-[#0f7681]/10" variant="primary" />
                        <StatCard icon={Phone} title="Con móvil" value={withMobilePhone} iconClassName="text-[#1a5f7a]" iconBgClassName="bg-[#1a5f7a]/10" variant="primary" />
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
                                    className="input pl-10 pr-10 rounded-xl"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        )}
                        <Button variant="register" icon={Plus} onClick={() => navigate('/systems/signatures/new')}>
                            Nueva firma
                        </Button>
                    </div>
                </div>
            </section>

            {loading ? (
                <LoadingSpinner />
            ) : error ? (
                <ErrorState message={error} onRetry={fetchSignatures} />
            ) : signatures.length === 0 ? (
                <EmptyState icon={FileSignature} title="No hay firmas guardadas" description="Crea la primera firma para empezar a usar el historial." actionLabel="Nueva firma" onAction={() => navigate('/systems/signatures/new')} />
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

            <Modal isOpen={!!toDelete} onClose={() => setToDelete(null)} title="Eliminar firma" icon={Trash2} size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setToDelete(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDelete} loading={deleting} icon={Trash2}>Eliminar</Button>
                    </>
                }
            >
                <p className="text-sm text-[var(--color-text-secondary)]">
                    ¿Eliminar la firma de <strong>{toDelete?.full_name}</strong>? Esta acción no se puede deshacer.
                </p>
            </Modal>
        </PageWrapper>
    );
}