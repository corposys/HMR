export default function Tabs({ items, activeId, onChange }) {
    return (
        <div className="border-b border-[var(--color-border)]">
            <nav className="flex overflow-x-auto" aria-label="Tabs">
                {items.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeId === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onChange(tab.id)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                isActive
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary)]/5'
                                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]'
                            }`}
                        >
                            {Icon && <Icon className="w-4 h-4" />}
                            {tab.label}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}