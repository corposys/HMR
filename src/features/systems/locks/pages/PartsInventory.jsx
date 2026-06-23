import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Package, Search, RefreshCw, X, Plus, ArrowUpRight, ArrowDownLeft,
    AlertTriangle, History
} from 'lucide-react';
import { useToast } from '@context/ToastContext';
import { apiJson } from '@utils/api';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import ErrorState from '@shared/common/ErrorState';
import CustomDropdown from '@shared/common/CustomDropdown';
import Button from '@shared/common/Button';
import Modal from '@shared/common/Modal';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const CATEGORY_OPTIONS = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'consumible', label: 'Consumibles' },
    { value: 'mecanico', label: 'Mecánico' },
    { value: 'carcasa', label: 'Carcasa' },
    { value: 'interno', label: 'Interno' },
    { value: 'electronico', label: 'Electrónico' },
];

const CATEGORY_LABELS = {
    consumible: 'Consumible',
    mecanico: 'Mecánico',
    carcasa: 'Carcasa',
    interno: 'Interno',
    electronico: 'Electrónico',
    battery: 'Batería',
};

export default function PartsInventory() {
    const { showToast } = useToast();

    const [parts, setParts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('catalog');

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [transactionMode, setTransactionMode] = useState('in');
    const [transactionPart, setTransactionPart] = useState(null);
    const [transactionForm, setTransactionForm] = useState({ quantity: 1, notes: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [partsRes, txRes] = await Promise.all([
                apiJson('/api/maintenance/part-types'),
                apiJson('/api/maintenance/parts/transactions?limit=50'),
            ]);
            setParts(partsRes.part_types || []);
            setTransactions(txRes.transactions || []);
        } catch (err) {
            setError(err.message || 'Error al cargar datos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredParts = useMemo(() => {
        return parts.filter(p => {
            const matchesSearch = !search ||
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
            const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [parts, search, categoryFilter]);

    const lowStockCount = useMemo(() => {
        return parts.filter(p => p.stock <= p.stock_min).length;
    }, [parts]);

    const openTransaction = (mode, part = null) => {
        setTransactionMode(mode);
        setTransactionPart(part);
        setTransactionForm({ quantity: 1, notes: '' });
        setShowTransactionModal(true);
    };

    const handleTransaction = async (e) => {
        e?.preventDefault();
        if (!transactionPart || transactionForm.quantity <= 0) return;
        setSubmitting(true);
        try {
            await apiJson('/api/maintenance/parts/transactions', {
                method: 'POST',
                body: {
                    part_type_id: transactionPart.id,
                    type: transactionMode,
                    quantity: transactionForm.quantity,
                    notes: transactionForm.notes || null,
                },
            });
            showToast({
                title: transactionMode === 'in' ? 'Ingreso registrado' : 'Salida registrada',
                message: `${transactionForm.quantity} × ${transactionPart.name}`,
                type: 'success',
            });
            setShowTransactionModal(false);
            fetchData();
        } catch (err) {
            showToast({ title: 'Error', message: err.message, type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading && parts.length === 0) {
        return <div className="flex items-center justify-center min-h-[400px]"><LoadingSpinner /></div>;
    }

    if (error && parts.length === 0) {
        return <ErrorState message={error} onRetry={fetchData} />;
    }

    return (
        <div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] mb-4">
                    <TabsTrigger value="catalog" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Catálogo
                        <span className="ml-1 text-[11px] text-[var(--color-text-muted)]">{parts.length}</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Historial
                        <span className="ml-1 text-[11px] text-[var(--color-text-muted)]">{transactions.length}</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="catalog" className="mt-0">
                    <Card className="p-6 bg-[var(--color-bg-secondary)] border-[var(--color-border)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="relative flex-1 sm:flex-none w-full sm:w-64 h-8">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Buscar pieza..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full h-full pl-8 pr-8 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {lowStockCount > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500">
                                        <AlertTriangle className="w-3 h-3" />
                                        {lowStockCount} bajo stock
                                    </span>
                                )}
                                <CustomDropdown
                                    value={categoryFilter}
                                    onChange={setCategoryFilter}
                                    options={CATEGORY_OPTIONS}
                                    placeholder="Categoría"
                                    className="min-w-[140px]"
                                    buttonClassName="h-8 text-xs"
                                />
                                <Button variant="ghost" onClick={fetchData} icon={RefreshCw} className="h-8 w-8 !p-0 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/10 shrink-0" />
                            </div>
                        </div>

                        {filteredParts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[var(--color-border)] rounded-lg">
                                <Package className="w-12 h-12 text-[var(--color-text-muted)] mb-3 opacity-50" />
                                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">No se encontraron piezas</h3>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                                            <th className="py-3 px-4">Pieza</th>
                                            <th className="py-3 px-4">Categoría</th>
                                            <th className="py-3 px-4">Descripción</th>
                                            <th className="py-3 px-4 text-center">Stock</th>
                                            <th className="py-3 px-4 text-center">Mínimo</th>
                                            <th className="py-3 px-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {filteredParts.map(part => {
                                            const isLow = part.stock <= part.stock_min;
                                            return (
                                                <tr key={part.id} className="hover:bg-[var(--color-bg-primary)]/50 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-[var(--color-text-primary)]">
                                                        {part.name}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                                                            {CATEGORY_LABELS[part.category] || part.category}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-[var(--color-text-secondary)] text-xs max-w-xs truncate" title={part.description}>
                                                        {part.description || '—'}
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-bold ${
                                                            part.stock === 0 ? 'bg-red-500/10 text-red-500'
                                                                : isLow ? 'bg-amber-500/10 text-amber-500'
                                                                : 'bg-green-500/10 text-green-500'
                                                        }`}>
                                                            {part.stock}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center text-[var(--color-text-muted)] text-xs">
                                                        {part.stock_min || 0}
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        <div className="flex justify-end gap-1.5">
                                                            <button
                                                                onClick={() => openTransaction('in', part)}
                                                                className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-lg border border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10 transition-colors font-medium"
                                                            >
                                                                <ArrowUpRight className="w-3 h-3" />
                                                                Ingreso
                                                            </button>
                                                            <button
                                                                onClick={() => openTransaction('out', part)}
                                                                disabled={part.stock === 0}
                                                                className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-lg border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                                                            >
                                                                <ArrowDownLeft className="w-3 h-3" />
                                                                Salida
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    <Card className="p-6 bg-[var(--color-bg-secondary)] border-[var(--color-border)]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Movimientos de inventario</h3>
                            <Button variant="ghost" onClick={fetchData} icon={RefreshCw} className="h-8 w-8 !p-0 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/10 shrink-0" />
                        </div>

                        {transactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[var(--color-border)] rounded-lg">
                                <History className="w-12 h-12 text-[var(--color-text-muted)] mb-3 opacity-50" />
                                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Sin movimientos</h3>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                                            <th className="py-3 px-4">Fecha</th>
                                            <th className="py-3 px-4">Pieza</th>
                                            <th className="py-3 px-4">Movimiento</th>
                                            <th className="py-3 px-4 text-center">Cantidad</th>
                                            <th className="py-3 px-4">Notas</th>
                                            <th className="py-3 px-4">Usuario</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {transactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-[var(--color-bg-primary)]/50 transition-colors">
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)] text-xs">
                                                    {formatDate(tx.created_at)}
                                                </td>
                                                <td className="py-3 px-4 font-bold text-[var(--color-text-primary)] text-xs">
                                                    {tx.part_name}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        tx.type === 'in' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {tx.type === 'in' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                                        {tx.type === 'in' ? 'Ingreso' : 'Salida'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center font-semibold text-[var(--color-text-primary)]">
                                                    {tx.quantity}
                                                </td>
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)] text-xs max-w-xs truncate" title={tx.notes}>
                                                    {tx.notes || '—'}
                                                </td>
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)] text-xs">
                                                    {tx.user_name || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            <Modal
                isOpen={showTransactionModal}
                onClose={() => setShowTransactionModal(false)}
                title={transactionMode === 'in' ? 'Ingreso de Stock' : 'Salida de Stock'}
                icon={transactionMode === 'in' ? ArrowUpRight : ArrowDownLeft}
                size="sm"
                footer={
                    <div className="flex gap-3 w-full">
                        <button type="button" onClick={() => setShowTransactionModal(false)} className="flex-1 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleTransaction}
                            disabled={submitting}
                            className={`flex-1 py-2 text-sm rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60 ${transactionMode === 'in' ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)]' : 'bg-[var(--color-danger)] hover:opacity-90'}`}
                        >
                            {transactionMode === 'in' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                            {submitting ? '...' : 'Confirmar'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    {transactionPart && (
                        <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
                            <p className="text-sm font-bold text-[var(--color-text-primary)]">{transactionPart.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                Stock actual: <strong className="text-[var(--color-text-secondary)]">{transactionPart.stock}</strong>
                            </p>
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Cantidad *</label>
                        <input
                            type="number"
                            min="1"
                            value={transactionForm.quantity}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Notas</label>
                        <textarea
                            value={transactionForm.notes}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
                            rows="2"
                            placeholder="Motivo del movimiento..."
                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
