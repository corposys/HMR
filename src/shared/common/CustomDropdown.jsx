import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomDropdown({
    value,
    onChange,
    options = [],
    placeholder = 'Seleccionar opción',
    emptyText = 'No hay opciones disponibles',
    disabled = false,
    className = '',
    menuClassName = '',
}) {
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selected = options.find((option) => option.value === value);
    const label = selected?.label || placeholder;

    const handleOptionSelect = (nextValue) => {
        if (disabled) return;
        onChange(nextValue);
        setIsOpen(false);
    };

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen((prev) => !prev)}
                disabled={disabled}
                className="w-full px-3 py-2 text-sm text-left bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] transition-colors flex items-center justify-between gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className={`truncate ${selected ? '' : 'text-[var(--color-text-muted)]'}`}>
                    {label}
                </span>
                <ChevronDown className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && !disabled && (
                <div className={`absolute z-50 mt-1 w-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto ${menuClassName}`}>
                    {options.length > 0 ? (
                        <ul className="py-1">
                            {options.map((option) => (
                                <li key={option.value}>
                                    <button
                                        type="button"
                                        onClick={() => handleOptionSelect(option.value)}
                                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                            option.value === value
                                                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                                                : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="px-3 py-2.5 text-sm text-[var(--color-text-muted)]">{emptyText}</p>
                    )}
                </div>
            )}
        </div>
    );
}