import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_STYLES = {
    success: {
        icon: CheckCircle2,
        classes: 'border-green-500/30 bg-green-500/10 text-green-400',
    },
    error: {
        icon: AlertTriangle,
        classes: 'border-red-500/30 bg-red-500/10 text-red-400',
    },
    info: {
        icon: Info,
        classes: 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]',
    },
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const showToast = useCallback(({ title, message = '', type = 'info', duration = 3200 }) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const toast = { id, title, message, type };

        setToasts((prev) => [...prev, toast]);
        window.setTimeout(() => removeToast(id), duration);

        return id;
    }, [removeToast]);

    const value = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => {
                    const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;
                    const Icon = style.icon;

                    return (
                        <div
                            key={toast.id}
                            className={`pointer-events-auto min-w-[260px] max-w-sm rounded-xl border px-3 py-3 shadow-lg backdrop-blur-sm ${style.classes}`}
                            role="status"
                            aria-live="polite"
                        >
                            <div className="flex items-start gap-3">
                                <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-semibold leading-tight">{toast.title}</p>
                                    {toast.message ? (
                                        <p className="text-xs opacity-90 mt-1 leading-snug">{toast.message}</p>
                                    ) : null}
                                </div>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="opacity-70 hover:opacity-100 transition-opacity"
                                    aria-label="Cerrar notificación"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe usarse dentro de ToastProvider');
    }
    return context;
}
