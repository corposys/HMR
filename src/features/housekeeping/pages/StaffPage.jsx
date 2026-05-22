import { useState, useCallback, useEffect } from 'react';
import { Users, Plus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import { apiFetch } from '@utils/api';
import StaffFormModal from '../components/StaffFormModal';
import StaffPerformanceCard from '../components/StaffPerformanceCard';

const COLORS = ['#eab308', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ec4899', '#06b6d4', '#84cc16', '#6366f1'];

export default function StaffPage() {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [performance, setPerformance] = useState(null);

    const fetchStaff = useCallback(async () => {
        try {
            const data = await apiFetch('/api/housekeeping/staff');
            setStaff(data.staff || []);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    const handleToggleActive = async (staffId, currentActive) => {
        await apiFetch(`/api/housekeeping/staff/${staffId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: !currentActive }),
        });
        await fetchStaff();
    };

    const handleEdit = (member) => {
        setEditingStaff(member);
        setShowFormModal(true);
    };

    const handleAdd = () => {
        setEditingStaff(null);
        setShowFormModal(true);
    };

    const handleFormSubmit = async (data) => {
        if (editingStaff) {
            await apiFetch(`/api/housekeeping/staff/${editingStaff.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        } else {
            await apiFetch('/api/housekeeping/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        }
        setShowFormModal(false);
        setEditingStaff(null);
        await fetchStaff();
    };

    const handleViewPerformance = async (member) => {
        setSelectedStaff(member);
        try {
            const data = await apiFetch(`/api/housekeeping/staff/${member.id}/performance`);
            setPerformance(data.performance);
        } catch {
            setPerformance(null);
        }
    };

    return (
        <PageWrapper title="Personal" subtitle="Gestión del equipo de housekeeping" icon={Users}>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-text-muted)]">
                            {staff.filter(s => s.is_active).length} activos / {staff.length} total
                        </span>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-all duration-150"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar miembro
                    </button>
                </div>

                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] animate-pulse p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-[var(--color-border)]" />
                                    <div>
                                        <div className="w-24 h-4 rounded bg-[var(--color-border)] mb-1" />
                                        <div className="w-16 h-2 rounded bg-[var(--color-border)]" />
                                    </div>
                                </div>
                                <div className="w-full h-2 rounded bg-[var(--color-border)]" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {staff.map(member => (
                            <div
                                key={member.id}
                                className={`rounded-xl border transition-all duration-150 overflow-hidden ${!member.is_active ? 'border-[var(--color-border)]/40 bg-[var(--color-bg-secondary)]/40 opacity-60' : 'border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-hover)]'}`}
                            >
                                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border)]/50">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                            style={{ backgroundColor: member.color }}
                                        >
                                            {member.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{member.full_name}</p>
                                            <p className="text-[10px] text-[var(--color-text-muted)]">
                                                {member.role === 'supervisor' ? 'Supervisora' : 'Camarera'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleActive(member.id, member.is_active)}
                                        className="p-1 rounded-md hover:bg-[var(--color-bg-tertiary)] transition-colors"
                                        title={member.is_active ? 'Desactivar' : 'Activar'}
                                    >
                                        {member.is_active
                                            ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                                            : <ToggleLeft className="w-5 h-5 text-[var(--color-text-muted)]" />
                                        }
                                    </button>
                                </div>

                                <div className="flex items-center justify-between px-3 py-2">
                                    <button
                                        onClick={() => handleViewPerformance(member)}
                                        className="text-[10px] text-[var(--color-primary)] hover:underline"
                                    >
                                        Ver rendimiento
                                    </button>
                                    <button
                                        onClick={() => handleEdit(member)}
                                        className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1 text-[10px] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] transition-colors"
                                    >
                                        <Edit2 className="w-2.5 h-2.5" />
                                        Editar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedStaff && performance && (
                    <StaffPerformanceCard
                        staff={selectedStaff}
                        performance={performance}
                        onClose={() => { setSelectedStaff(null); setPerformance(null); }}
                    />
                )}
            </div>

            <StaffFormModal
                staff={editingStaff}
                colors={COLORS}
                isOpen={showFormModal}
                onClose={() => { setShowFormModal(false); setEditingStaff(null); }}
                onSubmit={handleFormSubmit}
            />
        </PageWrapper>
    );
}
