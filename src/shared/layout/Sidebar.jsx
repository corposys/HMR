import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Settings, Wrench, ChevronDown, Shield, BedDouble, Hotel, ServerCog, CalendarCheck, Monitor } from 'lucide-react';

const sidebarConfig = [
    {
        type: 'link',
        to: '/',
        icon: Home,
        label: 'Dashboard',
        end: true,
    },
    {
        type: 'link',
        to: '/rack',
        icon: Monitor,
        label: 'Rack Operativo',
    },
    {
        type: 'dropdown',
        id: 'reservations',
        icon: CalendarCheck,
        label: 'Reservaciones',
        items: [
            { to: '/reservaciones/dashboard', label: 'Dashboard' },
            { to: '/reservaciones', label: 'Reservas' },
            { to: '/reservaciones/tarifas', label: 'Temporadas y Tarifas' },
        ],
    },
    {
        type: 'dropdown',
        id: 'reception',
        icon: Hotel,
        label: 'Recepción',
        items: [
            { to: '/reception/dashboard', label: 'Dashboard' },
            { to: '/reception/operations', label: 'Check-in/out' },
            { to: '/reception/folios', label: 'Folios' },
            { to: '/reception/walkins', label: 'Walk-ins' },
            { to: '/reception/audit', label: 'Auditoría' },
            { to: '/reception/logbook', label: 'Novedades' },
        ],
    },
    {
        type: 'dropdown',
        id: 'housekeeping',
        icon: BedDouble,
        label: 'Housekeeping',
        items: [
            { to: '/housekeeping/dashboard', label: 'Dashboard' },
            { to: '/housekeeping', label: 'Asignaciones' },
            { to: '/housekeeping/panel', label: 'Panel de Camarera' },
            { to: '/housekeeping/inspeccion', label: 'Inspección' },
            { to: '/housekeeping/incidencias', label: 'Incidencias' },
            { to: '/housekeeping/personal', label: 'Personal' },
            { to: '/housekeeping/lenceria', label: 'Lencería' },
        ],
    },
    {
        type: 'dropdown',
        id: 'maintenance',
        icon: Wrench,
        label: 'Mantenimiento',
        items: [
            { to: '/maintenance/habitaciones', label: 'Habitaciones' },
        ],
    },
    {
        type: 'dropdown',
        id: 'security',
        icon: Shield,
        label: 'Seguridad',
        items: [
            { to: '/security/vehicle-control', label: 'Control de Vehiculos' },
        ],
    },
    {
        type: 'dropdown',
        id: 'systems',
        icon: ServerCog,
        label: 'Sistemas',
        items: [
            { to: '/signatures', label: 'Firmas' },
            { to: '/maintenance/rooms', label: 'Cerraduras' },
        ],
    },
];

function SidebarDropdown({ section, isOpen, onToggle, isActive, onCloseMobile }) {
    const Icon = section.icon;
    
    return (
        <div>
            <button
                onClick={onToggle}
                aria-expanded={isOpen}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
                    isActive
                        ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                }`}
            >
                <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{section.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-80 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                <div className="flex flex-col gap-1 py-1">
                    {section.items.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onCloseMobile}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 py-1.5 pl-10 pr-2.5 text-sm rounded-lg transition-colors ${
                                    isActive
                                        ? 'text-[var(--color-text-primary)] font-medium bg-[var(--color-bg-tertiary)]/50'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/30'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`w-1 h-1 rounded-full transition-colors ${isActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)] group-hover:bg-[var(--color-text-secondary)]'}`} />
                                    <span>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function Sidebar({ isMobileOpen = false, onCloseMobile }) {
    const location = useLocation();
    
    // Calculate which dropdowns should be open based on current path
    const activeDropdowns = useMemo(() => {
        const active = {};
        sidebarConfig.forEach(section => {
            if (section.type === 'dropdown') {
                const isActive = section.items.some(item => 
                    location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                );
                if (isActive) {
                    active[section.id] = true;
                }
            }
        });
        return active;
    }, [location.pathname]);
    
    // State for manually toggled dropdowns (overrides auto-open)
    const [openDropdowns, setOpenDropdowns] = useState({});
    
    // Merge auto-open with manual toggles
    const dropdownState = useMemo(() => ({
        ...activeDropdowns,
        ...openDropdowns,
    }), [activeDropdowns, openDropdowns]);
    
    const toggleDropdown = (id) => {
        setOpenDropdowns(prev => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // Close mobile menu on route change
    useEffect(() => {
        onCloseMobile?.();
    }, [location.pathname, onCloseMobile]);

    return (
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] h-full flex-shrink-0 flex flex-col transition-transform duration-300 ease-out md:static md:z-auto md:w-56 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
            <div className="px-3 py-2 border-b border-[var(--color-border)] h-14 flex items-center">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    HMR<span className="text-[var(--color-primary)]"> System</span>
                </h2>
            </div>
            <nav className="p-3 flex-1 flex flex-col overflow-y-auto scrollbar-hide" aria-label="Main navigation">
                <div className="space-y-1.5">
                    {sidebarConfig.map((section) => {
                        if (section.type === 'link') {
                            const Icon = section.icon;
                            return (
                                <NavLink 
                                    key={section.to}
                                    to={section.to} 
                                    end={section.end}
                                    onClick={onCloseMobile} 
                                    className={({ isActive }) => `flex items-center gap-3 px-2.5 py-1.5 text-sm rounded-lg transition-colors ${isActive ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'}`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{section.label}</span>
                                </NavLink>
                            );
                        }
                        
                        // Dropdown section
                        const isActive = section.items.some(item => 
                            location.pathname === item.to || location.pathname.startsWith(item.to + '/')
                        );
                        
                        return (
                            <SidebarDropdown
                                key={section.id}
                                section={section}
                                isOpen={!!dropdownState[section.id]}
                                onToggle={() => toggleDropdown(section.id)}
                                isActive={isActive}
                                onCloseMobile={onCloseMobile}
                            />
                        );
                    })}
                </div>

                <div className="mt-auto pt-3">
                    <NavLink
                        to="/settings"
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-2.5 py-1.5 text-sm rounded-lg border transition-colors ${
                                isActive
                                    ? 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-primary)]'
                                    : 'border-[var(--color-border)]/60 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                            }`
                        }
                    >
                        <Settings className="w-4 h-4" />
                        <span>Configuración</span>
                    </NavLink>
                </div>

            </nav>
        </aside>
    );
}
