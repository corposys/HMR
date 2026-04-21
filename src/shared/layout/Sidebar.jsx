import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Settings, Wrench, ChevronDown, Shield, BedDouble, Hotel, ServerCog } from 'lucide-react';

export default function Sidebar() {
    const location = useLocation();
    const isSystemsActive = location.pathname.startsWith('/signatures');
    const [isSystemsOpen, setIsSystemsOpen] = useState(isSystemsActive);
    const isMaintenanceActive = location.pathname.startsWith('/maintenance');
    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(isMaintenanceActive);
    const isSecurityActive = location.pathname.startsWith('/security');
    const [isSecurityOpen, setIsSecurityOpen] = useState(isSecurityActive);
    const isHousekeepingActive = location.pathname.startsWith('/housekeeping');
    const [isHousekeepingOpen, setIsHousekeepingOpen] = useState(isHousekeepingActive);
    const isReceptionActive = location.pathname.startsWith('/reception');
    const [isReceptionOpen, setIsReceptionOpen] = useState(isReceptionActive);

    useEffect(() => {
        if (isSystemsActive) {
            setIsSystemsOpen(true);
        }
    }, [isSystemsActive]);
    useEffect(() => {
        if (isMaintenanceActive) {
            setIsMaintenanceOpen(true);
        }
    }, [isMaintenanceActive]);
    useEffect(() => {
        if (isSecurityActive) {
            setIsSecurityOpen(true);
        }
    }, [isSecurityActive]);
    useEffect(() => {
        if (isHousekeepingActive) {
            setIsHousekeepingOpen(true);
        }
    }, [isHousekeepingActive]);
    useEffect(() => {
        if (isReceptionActive) {
            setIsReceptionOpen(true);
        }
    }, [isReceptionActive]);
    return (
        <aside className="w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] hidden md:flex h-full flex-shrink-0 flex-col">
            <div className="p-4 border-b border-[var(--color-border)] h-16 flex items-center">
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                    HMR<span className="text-[var(--color-primary)]"> System</span>
                </h2>
            </div>
            <nav className="p-4 flex-1 flex flex-col">
                <div className="space-y-2">
                    <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-[var(--shadow-none)] text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'}`}>
                        <Home className="w-5 h-5" />
                        <span>Dashboard</span>
                    </NavLink>
                {/* Dropdown Recepción */}
                <div>
                    <button
                        onClick={() => setIsReceptionOpen(!isReceptionOpen)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                            isReceptionActive
                                ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-primary)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Hotel className="w-5 h-5" />
                            <span>Recepción</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isReceptionOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isReceptionOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                        <div className="flex flex-col gap-1 py-1">
                            <NavLink
                                to="/reception/reservas"
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 py-2 pl-11 pr-3 text-sm rounded-lg transition-colors ${
                                        isActive
                                            ? 'text-[var(--color-text-primary)] font-medium bg-[var(--color-bg-tertiary)]/50'
                                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/30'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)] group-hover:bg-[var(--color-text-secondary)]'}`} />
                                        <span>Reservas</span>
                                    </>
                                )}
                            </NavLink>
                        </div>
                    </div>
                </div>
                {/* Dropdown Housekeeping */}
                <div>
                    <button
                        onClick={() => setIsHousekeepingOpen(!isHousekeepingOpen)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                            isHousekeepingActive
                                ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-primary)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <BedDouble className="w-5 h-5" />
                            <span>Housekeeping</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isHousekeepingOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isHousekeepingOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                        <div className="flex flex-col gap-1 py-1">
                            <NavLink
                                to="/housekeeping/lenceria"
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 py-2 pl-11 pr-3 text-sm rounded-lg transition-colors ${
                                        isActive
                                            ? 'text-[var(--color-text-primary)] font-medium bg-[var(--color-bg-tertiary)]/50'
                                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/30'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)] group-hover:bg-[var(--color-text-secondary)]'}`} />
                                        <span>Lenceria</span>
                                    </>
                                )}
                            </NavLink>
                        </div>
                    </div>
                </div>
                {/* Dropdown Mantenimiento */}
                <div>
                    <button 
                        onClick={() => setIsMaintenanceOpen(!isMaintenanceOpen)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                            isMaintenanceActive
                                ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-primary)]' 
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Wrench className="w-5 h-5" />
                            <span>Mantenimiento</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMaintenanceOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMaintenanceOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                        <div className="flex flex-col gap-1 py-1">
                            {/* Habitaciones */}
                            <NavLink to="/maintenance/rooms" className={({ isActive }) => `group flex items-center gap-3 py-2 pl-11 pr-3 text-sm rounded-lg transition-colors ${isActive ? 'text-[var(--color-text-primary)] font-medium bg-[var(--color-bg-tertiary)]/50' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/30'}`}>
                                {({ isActive }) => (
                                    <>
                                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)] group-hover:bg-[var(--color-text-secondary)]'}`} />
                                        <span>Habitaciones</span>
                                    </>
                                )}
                            </NavLink>
                            {/* Cerraduras (Historial) */}
                            <NavLink to="/maintenance" end className={({ isActive }) => `group flex items-center gap-3 py-2 pl-11 pr-3 text-sm rounded-lg transition-colors ${isActive ? 'text-[var(--color-text-primary)] font-medium bg-[var(--color-bg-tertiary)]/50' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/30'}`}>
                                {({ isActive }) => (
                                    <>
                                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)] group-hover:bg-[var(--color-text-secondary)]'}`} />
                                        <span>Cerraduras</span>
                                    </>
                                )}
                            </NavLink>

                        </div>
                    </div>
                </div>
                {/* Dropdown Seguridad */}
                <div>
                    <button
                        onClick={() => setIsSecurityOpen(!isSecurityOpen)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                            isSecurityActive
                                ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-primary)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5" />
                            <span>Seguridad</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSecurityOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSecurityOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                        <div className="flex flex-col gap-1 py-1">
                            <NavLink
                                to="/security/vehicle-control"
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 py-2 pl-11 pr-3 text-sm rounded-lg transition-colors ${
                                        isActive
                                            ? 'text-[var(--color-text-primary)] font-medium bg-[var(--color-bg-tertiary)]/50'
                                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/30'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)] group-hover:bg-[var(--color-text-secondary)]'}`} />
                                        <span>Control de Vehiculos</span>
                                    </>
                                )}
                            </NavLink>
                        </div>
                    </div>
                </div>
                {/* Dropdown Sistemas */}
                <div>
                    <button
                        onClick={() => setIsSystemsOpen(!isSystemsOpen)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                            isSystemsActive
                                ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-primary)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <ServerCog className="w-5 h-5" />
                            <span>Sistemas</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSystemsOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSystemsOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                        <div className="flex flex-col gap-1 py-1">
                            <NavLink
                                to="/signatures"
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 py-2 pl-11 pr-3 text-sm rounded-lg transition-colors ${
                                        isActive
                                            ? 'text-[var(--color-text-primary)] font-medium bg-[var(--color-bg-tertiary)]/50'
                                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]/30'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-text-muted)] group-hover:bg-[var(--color-text-secondary)]'}`} />
                                        <span>Firmas</span>
                                    </>
                                )}
                            </NavLink>
                        </div>
                    </div>
                </div>
                </div>

                <div className="mt-auto pt-4">
                    <NavLink
                        to="/settings"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                                isActive
                                    ? 'border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-primary)]'
                                    : 'border-[var(--color-border)]/60 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                            }`
                        }
                    >
                        <Settings className="w-5 h-5" />
                        <span>Configuración</span>
                    </NavLink>
                </div>

            </nav>
        </aside>
    );
}
