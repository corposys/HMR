import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, RefreshCw, X } from 'lucide-react';
import Button from '@shared/common/Button';

export default function LockModuleTabs({
    modules,
    activeModule,
    onModuleChange,
    search,
    setSearch,
    onRefresh
}) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Tabs value={activeModule} onValueChange={onModuleChange} className="w-full sm:w-auto">
                <TabsList className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] h-auto flex-nowrap gap-1 p-1 justify-start overflow-x-auto scrollbar-hide w-full sm:w-auto">
                    {modules.map(mod => (
                        <TabsTrigger
                            key={mod.id}
                            value={mod.id}
                            className="flex-1 sm:flex-none data-[state=active]:bg-[var(--color-bg-tertiary)] data-[state=active]:text-[var(--color-text-primary)] text-[var(--color-text-secondary)] text-xs px-2 sm:px-3 py-1.5 rounded-md whitespace-nowrap shrink-0"
                        >
                            <span>{mod.name}</span>
                            <span className="ml-1 text-[10px] text-[var(--color-text-muted)] data-[state=active]:text-[var(--color-text-muted)]">
                                {mod.count}
                            </span>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                {/* Search bar - visible en todos los tamaños */}
                <div className="relative flex-1 sm:flex-none w-full sm:w-64 h-8">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full h-full pl-8 pr-8 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                <Button variant="ghost" onClick={onRefresh} icon={RefreshCw} className="h-8 w-8 !p-0 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/10 shrink-0" />
            </div>
        </div>
    );
}