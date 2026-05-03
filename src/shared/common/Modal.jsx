import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};

export default function Modal({ isOpen, onClose, title, icon: Icon, size = 'md', children, footer }) {
    const overlayRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
            <div className={`relative w-full ${sizeClasses[size] || sizeClasses.md} bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-2xl animate-fade-in overflow-hidden`}>
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
                        <div className="flex items-center gap-3">
                            {Icon && <Icon className="w-5 h-5 text-[var(--color-primary)]" />}
                            <h2 className="text-base font-semibold">{title}</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}
                {!title && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] transition-colors z-10"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
                {footer && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--color-border)]">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}