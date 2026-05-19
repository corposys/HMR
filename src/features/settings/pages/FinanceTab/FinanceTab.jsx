import { DollarSign, RefreshCw } from 'lucide-react';
import { Button } from '@components/ui/button';
import { useState } from 'react';
import { apiJson } from '@utils/api';
import { useToast } from '@context/ToastContext';

export default function FinanceTab() {
    const { showToast } = useToast();
    const [igtfRate, setIgtfRate] = useState('0.03');
    const [ivaRate, setIvaRate] = useState('0.00');
    const [bcvRate, setBcvRate] = useState(null);
    const [loadingBcv, setLoadingBcv] = useState(false);

    const handleRefreshBcv = async () => {
        setLoadingBcv(true);
        try {
            const data = await apiJson('/api/settings/bcv/refresh', { method: 'POST' });
            setBcvRate(data.rate?.rate);
            showToast({ title: 'Tasa BCV actualizada', message: `Nueva tasa: ${data.rate?.rate}`, type: 'success' });
        } catch {
            showToast({ title: 'Error', message: 'No se pudo actualizar la tasa BCV', type: 'error' });
        } finally {
            setLoadingBcv(false);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                    <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">Finanzas</h1>
                    <p className="text-sm text-[var(--color-text-secondary)]">Tasas, impuestos y tipo de cambio</p>
                </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5">Tasa IGTF (%)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={igtfRate}
                        onChange={(e) => setIgtfRate(e.target.value)}
                        className="input w-40"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5">Tasa IVA (%)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={ivaRate}
                        onChange={(e) => setIvaRate(e.target.value)}
                        className="input w-40"
                    />
                </div>
            </div>

            <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Tasa BCV (Bs por USD)</label>
                        <div className="text-2xl font-bold text-[var(--color-primary)]">
                            {bcvRate ? `${bcvRate} Bs` : '—'}
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefreshBcv} loading={loadingBcv}>
                        <RefreshCw className="w-4 h-4" />
                        Actualizar desde BCV
                    </Button>
                </div>
            </div>
        </div>
    );
}