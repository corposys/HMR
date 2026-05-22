import React, { useState, useEffect } from 'react';
import { StickyNote, X, Save } from 'lucide-react';
import Modal from '@shared/common/Modal';
import { apiFetch } from '@utils/api';

export default function NotesModal({ lockId, currentNotes, onClose, onSave }) {
    const [notes, setNotes] = useState(currentNotes || '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setNotes(currentNotes || '');
    }, [currentNotes]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await apiFetch(`/api/maintenance/locks/${lockId}`, {
                method: 'PATCH',
                body: JSON.stringify({ notes }),
            });
            onSave(notes);
            onClose();
        } catch (err) {
            setError(err.message || 'Error al guardar nota');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Observaciones de cerradura"
            icon={StickyNote}
            size="md"
            footer={
                <div className="flex gap-3 w-full">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-2 text-sm rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {saving ? (
                            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Guardar nota
                    </button>
                </div>
            }
        >
            <div className="space-y-3">
                {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                        Observaciones para esta cerradura
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={5}
                        placeholder="Ej: Marco desalineado, hay que empujar la puerta con fuerza para cerrar. Puerta del baño trabada..."
                        className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none resize-none placeholder:text-[var(--color-text-muted)]"
                        autoFocus
                    />
                    <p className="mt-1.5 text-[10px] text-[var(--color-text-muted)]">
                        Estas notas son visibles en el rack para que sepas qué esperar antes de ir a la habitación.
                    </p>
                </div>
            </div>
        </Modal>
    );
}