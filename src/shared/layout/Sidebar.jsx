import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Home, Settings, Wrench, ChevronDown, Shield, BedDouble, Hotel,
    ServerCog, CalendarCheck, Monitor, LayoutGrid, Receipt, ClipboardCheck
} from 'lucide-react';

const sidebarConfig = [
    {
        type: 'link',
        to: '/',
        icon: Home,
        label: 'Dashboard',
        end: true,
    },
    {
        type: 'dropdown',
        id: 'systems',
        icon: ServerCog,
        label: 'Sistemas',
        items: [
            { to: '/systems/signatures', label: 'Firmas' },
            { to: '/systems/rooms', label: 'Cerraduras' },
            { to: '/systems/printers', label: 'Impresoras' },
        ],
    },
    {
        type: 'link',
        to: '/reportes',
        icon: ClipboardCheck,
        label: 'Reportes',
    },
];

function SidebarDropdown({ section, isOpen, onToggle, isActive, onCloseMobile, isExpanded }) {
    const Icon = section.icon;

    return (
        <div>
            <button
                onClick={onToggle}
                aria-expanded={isOpen}
                className={`w-full flex items-center rounded-lg transition-colors text-sm
                    ${isActive
                        ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                    }
                    ${isExpanded ? 'px-2.5 py-1.5 justify-between' : 'md:px-0 md:py-1.5 md:justify-center'}
                `}
            >
                <div className={`flex items-center ${isExpanded ? 'gap-3' : 'md:gap-0'}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[200px]' : 'md:opacity-0 md:max-w-0'}`}>
                        {section.label}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''} ${isExpanded ? '' : 'md:hidden'}`} />
            </button>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-80 opacity-100 mt-1' : 'max-h-0 opacity-0'} ${isExpanded ? '' : 'md:hidden'}`}>
                <div className="flex flex-col gap-1 py-1">
                    {section.items.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={onCloseMobile}
                            className={({ isActive }) =>
                                `group flex items-center gap-3 py-1.5 pr-2.5 text-sm rounded-lg transition-colors
                                    ${isActive
                                        ? 'text-[var(--color-text-primary)] font-medium bg-[var(--color-bg-tertiary)]/50'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/30'
                                    }
                                    ${isExpanded ? 'pl-10' : 'md:pl-2 md:justify-center'}
                                `
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`w-1 h-1 rounded-full transition-colors shrink-0 ${isActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)] group-hover:bg-[var(--color-text-secondary)]'} ${isExpanded ? '' : 'md:hidden'}`} />
                                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[200px]' : 'md:opacity-0 md:max-w-0'}`}>
                                        {item.label}
                                    </span>
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
    const [isHovered, setIsHovered] = useState(false);

    const isExpanded = isMobileOpen || isHovered;

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

    const [openDropdowns, setOpenDropdowns] = useState({});

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

    useEffect(() => {
        onCloseMobile?.();
    }, [location.pathname, onCloseMobile]);

    return (
        <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`fixed bottom-0 left-0 h-full flex-shrink-0 flex flex-col bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] transition-all duration-300 ease-out overflow-hidden
                ${isMobileOpen ? 'top-0 w-64 translate-x-0 z-50' : 'top-0 -translate-x-full z-40'}
                md:translate-x-0 md:top-0
                ${isExpanded ? 'md:w-56 md:z-50' : 'md:w-14 md:z-40'}
            `}
        >
            <div className={`px-3 py-2 border-b border-[var(--color-border)] h-14 flex items-center shrink-0 transition-all duration-300 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
                {isExpanded ? (
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] whitespace-nowrap">
                        HMR<span className="text-[var(--color-primary)]"> System</span>
                    </h2>
                ) : (
                    <Hotel className="w-6 h-6 text-[var(--color-primary)]" />
                )}
            </div>

            <nav className="p-3 flex-1 flex flex-col overflow-y-auto scrollbar-hide gap-1.5" aria-label="Main navigation">
                {sidebarConfig.map((section) => {
                    if (section.type === 'link') {
                        const Icon = section.icon;
                        return (
                            <NavLink
                                key={section.to}
                                to={section.to}
                                end={section.end}
                                onClick={onCloseMobile}
                                className={({ isActive }) => `flex items-center rounded-lg transition-colors text-sm
                                    ${isActive
                                        ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-primary)]'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                                    }
                                    ${isExpanded ? 'px-2.5 py-1.5 gap-3 justify-start' : 'md:px-0 md:py-1.5 md:justify-center md:gap-0'}
                                `}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[200px]' : 'md:opacity-0 md:max-w-0'}`}>
                                    {section.label}
                                </span>
                            </NavLink>
                        );
                    }

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
                            isExpanded={isExpanded}
                        />
                    );
                })}

                <div className="mt-auto pt-3">
                    <NavLink
                        to="/settings/general"
                        onClick={onCloseMobile}
                        className={({ isActive }) =>
                            `flex items-center rounded-lg border transition-colors text-sm
                                ${isActive
                                    ? 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-primary)]'
                                    : 'border-[var(--color-border)]/60 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                                }
                                ${isExpanded ? 'px-2.5 py-1.5 gap-3 justify-start' : 'md:px-0 md:py-1.5 md:justify-center md:gap-0'}
                            `
                        }
                    >
                        <Settings className="w-4 h-4 shrink-0" />
                        <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100 max-w-[200px]' : 'md:opacity-0 md:max-w-0'}`}>
                            Configuración
                        </span>
                    </NavLink>
                </div>
            </nav>
        </aside>
    );
}
