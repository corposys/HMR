import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Separator } from '@components/ui/separator';

export default function SettingsSaveBar({ isDirty, isSaving, onSave, onDiscard }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(isDirty);
    }, [isDirty]);

    if (!visible) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl shadow-2xl px-5 py-3 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <span className="text-sm text-[var(--color-text-secondary)]">
                Tienes cambios sin guardar
            </span>
            <Separator orientation="vertical" className="h-5" />
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onDiscard} className="text-[var(--color-text-secondary)]">
                    <X className="w-3.5 h-3.5" />
                    Descartar
                </Button>
                <Button size="sm" onClick={onSave} disabled={isSaving} className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90">
                    {isSaving ? (
                        <span className="animate-pulse">Guardando...</span>
                    ) : (
                        <>
                            <Check className="w-3.5 h-3.5" />
                            Guardar cambios
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}