import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileSignature, Plus, Search, Trash2, Edit3,
    Mail, Phone, Briefcase, Calendar, Users,
    TrendingUp, AlertCircle, Loader2, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import Button from '@shared/common/Button';

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

function StatCard({ icon: Icon, label, value, color }) {
    return (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5 flex items-center gap-4 shadow-sm">
            <div className="p-3 rounded-xl" style={{ background: `${color}18` }}>
                <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)] leading-none">{value}</p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">{label}</p>
            </div>
        </div>
    );
}

function EmptyState({ onNew }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center shadow-inner">
                <FileSignature className="w-10 h-10 text-[var(--color-text-muted)]" />
            </div>
            <div className="text-center">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                    No hay firmas guardadas
                </h3>
            </div>
        </div>
    );
}

function DeleteModal({ signature, onConfirm, onCancel, loading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
            <div className="relative bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10">
                <button onClick={onCancel} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]">
                    <X className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-4 mb-5">
                    <div className="p-3 bg-red-500/10 rounded-xl shrink-0">
                        <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Eliminar firma</h3>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            ¿Eliminar la firma de <strong>{signature?.full_name}</strong>? Esta acción no se puede deshacer.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-2 text-sm rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}

function SignatureRow({ signature, colorData, onEdit, onDelete }) {
    return (
        <tr className="group border-b border-[var(--color-border)] hover:bg-[var(--color-bg-tertiary)]/50 transition-colors">
            {/* Avatar */}
            <td className="py-2 pl-3 pr-2 w-10">
                <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: colorData.bg, color: colorData.text }}
                >
                    {getInitials(signature.full_name)}
                </div>
            </td>
            {/* Name */}
            <td className="py-2 px-2 whitespace-nowrap">
                <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">{signature.full_name}</p>
            </td>
            {/* Job title */}
            <td className="py-2 px-2">
                <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                    <Briefcase className="w-3 h-3 shrink-0 text-[var(--color-text-muted)]" />{signature.job_title}
                </span>
            </td>
            {/* Email */}
            <td className="py-2 px-2">
                <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                    <Mail className="w-3 h-3 shrink-0 text-[var(--color-text-muted)]" />{signature.email}
                </span>
            </td>
            {/* Date */}
            <td className="py-2 px-2 whitespace-nowrap">
                <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                    <Calendar className="w-3 h-3 shrink-0" />{formatDate(signature.created_at)}
                </span>
            </td>
            {/* Actions */}
            <td className="py-2 pl-2 pr-3 w-20">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                    <button onClick={() => onEdit(signature)} title="Abrir generador"
                        className="p-1.5 rounded-md hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] text-[var(--color-text-muted)] transition-colors flex items-center gap-1 text-xs font-medium">
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onEdit(signature)} title="Editar"
                        className="p-1.5 rounded-md hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] text-[var(--color-text-muted)] transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDelete(signature)} title="Eliminar"
                        className="p-1.5 rounded-md hover:bg-red-500/10 hover:text-red-500 text-[var(--color-text-muted)] transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function SignaturesHistory() {
    const navigate = useNavigate();
    const { user } = useAuth();

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

    // Filtered list
    const filtered = signatures.filter(s => {
        const q = search.toLowerCase();
        return (
            s.full_name.toLowerCase().includes(q) ||
            s.job_title.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q)
        );
    });

    return (
        <div className="py-4 px-4 lg:px-8 w-full">
            <div className="mx-auto max-w-auto">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                        </div>
                    </div>

                    {/* Right: Search & Action */}
                    <div className="flex items-center gap-3">
                        {signatures.length > 0 && (
                            <div className="relative flex-1 sm:w-64">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Buscar por nombre, cargo..."
                                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                        <Button
                            onClick={() => navigate('/signatures/new')}
                            variant="register"
                            icon={Plus}
                            className="shrink-0"
                        >
                            Nueva Firma
                        </Button>
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-6">
                    <StatCard icon={Users} label="Firmas totales" value={signatures.length} color="#009098" />
                    <StatCard icon={TrendingUp} label="Este mes" value={thisMonth} color="#0f7681" />
                </div>



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
                    <div className="text-center py-16 text-[var(--color-text-secondary)] text-sm">
                        Sin resultados para <strong>"{search}"</strong>
                    </div>
                ) : (
                    <>
                        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                                        <th className="py-2 pl-3 pr-2 w-10"></th>
                                        <th className="py-2 px-2 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Nombre y Apellido</th>
                                        <th className="py-2 px-2 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Departamento / Cargo</th>
                                        <th className="py-2 px-2 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Correo</th>
                                        <th className="py-2 px-2 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Fecha</th>
                                        <th className="py-2 pl-2 pr-3 w-20"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((sig, idx) => (
                                        <SignatureRow
                                            key={sig.id}
                                            signature={sig}
                                            colorData={AVATAR_COLORS[idx % AVATAR_COLORS.length]}
                                            onEdit={handleEdit}
                                            onDelete={setToDelete}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
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
