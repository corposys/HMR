import { LayoutDashboard } from 'lucide-react';

export default function HousekeepingOperacionesPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-[var(--color-text-muted)]">
            <LayoutDashboard className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Operaciones</h2>
            <p className="text-center">Dashboard, Asignaciones y Panel de Camarera</p>
        </div>
    );
}