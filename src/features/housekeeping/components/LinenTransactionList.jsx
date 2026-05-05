import { ArrowUpDown, Package, ArrowRight, ArrowLeft, Hash, Calendar } from 'lucide-react';

const TYPE_CONFIG = {
    restock: { icon: Package, label: 'Reabastecimiento', color: 'text-emerald-400' },
    checkout: { icon: ArrowLeft, label: 'Salida', color: 'text-blue-400' },
    return: { icon: ArrowRight, label: 'Devolución', color: 'text-cyan-400' },
    loss: { icon: Hash, label: 'Pérdida', color: 'text-red-400' },
};

export default function LinenTransactionList({ transactions, loading }) {
    if (loading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] animate-pulse p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-border)]" />
                            <div>
                                <div className="w-24 h-3 rounded bg-[var(--color-border)] mb-1" />
                                <div className="w-16 h-2 rounded bg-[var(--color-border)]" />
                            </div>
                        </div>
                        <div className="w-12 h-4 rounded bg-[var(--color-border)]" />
                    </div>
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
                <ArrowUpDown className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">No hay transacciones registradas hoy</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {transactions.map(tx => {
                const config = TYPE_CONFIG[tx.transaction_type] || TYPE_CONFIG.checkout;
                const Icon = config.icon;
                return (
                    <div
                        key={tx.id}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 flex items-center justify-between transition-all duration-150 hover:border-[var(--color-border-hover)]"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-bg-tertiary)]`}>
                                <Icon className={`w-4 h-4 ${config.color}`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{tx.linen_name || 'Sin nombre'}</p>
                                <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-muted)]">
                                    <span className={config.color}>{config.label}</span>
                                    {tx.floor_code && <span>{tx.floor_code}</span>}
                                    {tx.staff_name && <span>• {tx.staff_name}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(tx.created_at).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <span className={`text-sm font-bold ${tx.transaction_type === 'loss' ? 'text-red-400' : tx.transaction_type === 'restock' ? 'text-emerald-400' : 'text-[var(--color-text-primary)]'}`}>
                                {tx.transaction_type === 'checkout' || tx.transaction_type === 'loss' ? '-' : '+'}{tx.quantity}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
