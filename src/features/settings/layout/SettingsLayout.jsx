import { NavLink, Outlet } from 'react-router-dom';
import { Globe, DollarSign, Building2, Link as LinkIcon, Users, CalendarDays, Clock, ClipboardCheck, Sparkles, Wrench, Shield, Settings } from 'lucide-react';

const tabs = [
    { to: '/settings/general', label: 'General', icon: Globe },
    { to: '/settings/currency', label: 'Moneda', icon: DollarSign },
    { to: '/settings/structure', label: 'Estructura', icon: Building2 },
    { to: '/settings/integrations', label: 'Integraciones', icon: LinkIcon },
    { to: '/settings/users', label: 'Usuarios', icon: Users },
    { to: '/settings/reservations', label: 'Reservas', icon: CalendarDays },
    { to: '/settings/reception', label: 'Recepción', icon: Clock },
    { to: '/settings/audit', label: 'Auditoría', icon: ClipboardCheck },
    { to: '/settings/housekeeping', label: 'Housekeeping', icon: Sparkles },
    { to: '/settings/maintenance', label: 'Mantenimiento', icon: Wrench },
    { to: '/settings/security', label: 'Seguridad', icon: Shield },
    { to: '/settings/systems', label: 'Sistemas', icon: Settings },
];

export default function SettingsLayout() {
    return (
        <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
            <div className="px-6 pt-5 pb-0">
                <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">Configuración</h1>
                <p className="text-sm text-[var(--color-text-secondary)]">Gestiona los ajustes de tu hotel</p>
            </div>
            <nav 
                className="flex overflow-x-auto border-b border-[var(--color-border)] px-6 mt-4 scrollbar-hide" 
                aria-label="Tabs de configuración"
            >
                {tabs.map((tab) => (
                    <NavLink
                        key={tab.to}
                        to={tab.to}
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                isActive
                                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)]'
                            }`
                        }
                    >
                        <tab.icon className="w-4 h-4 shrink-0" />
                        {tab.label}
                    </NavLink>
                ))}
            </nav>
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}