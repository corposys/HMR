export default function ToggleSwitch({ checked, onChange, disabled = false, size = 'md', activeLabel, inactiveLabel }) {
    const height = size === 'sm' ? 'h-5' : 'h-6';
    const width = size === 'sm' ? 'w-9' : 'w-11';
    const circleSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    const translate = size === 'sm' ? 'translate-x-4' : 'translate-x-5';

    return (
        <div className="flex items-center gap-2">
            {(activeLabel || inactiveLabel) && (
                <span className={`text-[10px] font-bold uppercase tracking-wider ${checked ? 'text-emerald-500' : 'text-zinc-500'}`}>
                    {checked ? activeLabel : inactiveLabel}
                </span>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${height} ${width} ${checked ? 'bg-[var(--color-primary)]' : 'bg-zinc-700'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
            >
                <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute left-[2px] top-1/2 inline-block -translate-y-1/2 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${circleSize} ${checked ? translate : 'translate-x-0'}`}
                />
            </button>
        </div>
    );
}