import { Users } from 'lucide-react';

export default function HousekeepingGestionPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-[var(--color-text-muted)]">
            <Users className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Gestión</h2>
            <p className="text-center">Personal y Lencería</p>
        </div>
    );
}