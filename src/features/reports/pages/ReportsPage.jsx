import React from 'react';
import { Wrench } from 'lucide-react';

export default function ReportsPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[80vh] text-[var(--color-text-secondary)]">
            <Wrench className="w-16 h-16 mb-4 text-[var(--color-primary)] opacity-50" />
            <h2 className="text-2xl font-bold mb-2 text-[var(--color-text-primary)]">Módulo en desarrollo</h2>
            <p>El módulo de Reportes estará disponible próximamente.</p>
        </div>
    );
}
