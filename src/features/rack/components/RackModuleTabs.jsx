import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RackModuleTabs({ modules, activeModule, onModuleChange }) {
    return (
        <div className="flex items-start">
            <Tabs value={activeModule} onValueChange={onModuleChange} className="w-full sm:w-auto">
                <TabsList className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] h-auto flex-nowrap gap-1 p-1 justify-start overflow-x-auto scrollbar-hide">
                    {modules.map(mod => (
                        <TabsTrigger
                            key={mod.id}
                            value={mod.id}
                            className="data-[state=active]:bg-[var(--color-bg-tertiary)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)] text-xs px-3 py-1.5 rounded-md whitespace-nowrap shrink-0"
                        >
                            <span>{mod.name}</span>
                            <span className="ml-1.5 text-[10px] text-[var(--color-text-muted)] data-[state=active]:text-[var(--color-text-muted)]">
                                {mod.count}
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
    );
}