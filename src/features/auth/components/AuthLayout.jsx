import { Shield, CheckCircle } from 'lucide-react';

/**
 * AuthLayout - Shared layout for authentication pages (Login/Register)
 * Two-column layout on desktop with branding on the left
 */
export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex bg-[var(--color-bg-primary)]">
            {/* Left panel - Branding (desktop only) */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] items-center justify-center p-12">
                <div className="max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-[var(--color-bg-tertiary)] rounded-2xl mb-6 border border-[var(--color-border)]">
                        <Shield className="w-10 h-10 text-[var(--color-primary)]" />
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
                        HMR<span className="text-[var(--color-primary)]"> System</span>
                    </h1>
                    <p className="text-[var(--color-text-secondary)] text-lg mb-8">
                        Sistema Integrado de Gestión Hotelera
                    </p>
                    <div className="space-y-4 text-left">
                        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                            <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
                            <span>Control centralizado de reservaciones</span>
                        </div>
                        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                            <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
                            <span>Gestión de limpieza y mantenimiento</span>
                        </div>
                        <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                            <CheckCircle className="w-5 h-5 text-[var(--color-success)]" />
                            <span>Módulos de restaurante y servicios</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
                {children}
            </div>
        </div>
    );
}
