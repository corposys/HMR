import React from 'react';
import { Trash2, X, Loader2 } from 'lucide-react';

export default function DeleteMaintenanceModal({ log, onConfirm, onCancel, loading }) {
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
                        <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">Eliminar registro</h3>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            ¿Eliminar el mantenimiento de la habitación <strong>{log?.room_number}</strong>? Esta acción no se puede deshacer.
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} disabled={loading} className="flex-1 py-2 text-sm rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
}
