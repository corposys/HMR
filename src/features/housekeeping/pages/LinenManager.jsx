import { useState, useCallback, useEffect, useMemo } from 'react';
import { Shirt, ArrowUpDown, Package, AlertTriangle, Plus } from 'lucide-react';
import PageWrapper from '@shared/common/PageWrapper';
import Tabs from '@shared/common/Tabs';
import { apiFetch } from '@utils/api';
import LinenInventoryGrid from '../components/LinenInventoryGrid';
import LinenTransactionModal from '../components/LinenTransactionModal';
import LinenTransactionList from '../components/LinenTransactionList';

const CATEGORY_LABELS = {
    bedding: 'Ropa de cama',
    bathroom: 'Toallas y baño',
    amenity: 'Amenidades',
    other: 'Otros',
};

export default function LinenManager() {
    const [activeTab, setActiveTab] = useState('inventory');
    const [linenTypes, setLinenTypes] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTransactionModal, setShowTransactionModal] = useState(false);

    const tabs = [
        { id: 'inventory', label: 'Inventario', icon: Package },
        { id: 'transactions', label: 'Transacciones', icon: ArrowUpDown },
    ];

    const fetchAll = useCallback(async () => {
        try {
            const [typesData, invData, transData] = await Promise.all([
                apiFetch('/api/housekeeping/linen/types'),
                apiFetch('/api/housekeeping/linen/inventory'),
                apiFetch('/api/housekeeping/linen/transactions'),
            ]);
            setLinenTypes(typesData.types || []);
            setInventory(invData.inventory || []);
            setTransactions(transData.transactions || []);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const handleTransactionSubmit = async (data) => {
        await apiFetch('/api/housekeeping/linen/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        await fetchAll();
    };

    const alertCount = useMemo(() => inventory.filter(i => i.below_par).length, [inventory]);

    return (
        <PageWrapper title="Lencería" subtitle="Gestión de inventario de lencería" icon={Shirt}>
            <div className="space-y-4">
                {alertCount > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2 text-xs text-yellow-400">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {alertCount} tipo{alertCount > 1 ? 's' : ''} de lencería por debajo del nivel mínimo
                    </div>
                )}

                {error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
                    <button
                        onClick={() => setShowTransactionModal(true)}
                        className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-all duration-150"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Nueva transacción
                    </button>
                </div>

                {activeTab === 'inventory' && (
                    <LinenInventoryGrid
                        linenTypes={linenTypes}
                        inventory={inventory}
                        loading={loading}
                        onUpdate={fetchAll}
                    />
                )}

                {activeTab === 'transactions' && (
                    <LinenTransactionList
                        transactions={transactions}
                        loading={loading}
                        onRefresh={fetchAll}
                    />
                )}
            </div>

            <LinenTransactionModal
                linenTypes={linenTypes}
                isOpen={showTransactionModal}
                onClose={() => setShowTransactionModal(false)}
                onSubmit={handleTransactionSubmit}
            />
        </PageWrapper>
    );
}
