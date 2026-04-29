import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    LogOut,
    ChevronDown,
    Github,
    Activity,
    Bell,
    Menu,
    X,
    LayoutDashboard,
    Hotel,
    DoorOpen,
    Shield,
    FileSignature,
    SettingsIcon
} from 'lucide-react';
import { useAuth } from '@context/AuthContext';

/**
 * Navbar - Barra superior de utilidades (Topbar)
 * Contiene: Buscador, Estado, Notificaciones, Github, Perfil
 */
export default function Navbar({ onMenuClick, isMobileSidebarOpen }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const dropdownRef = useRef(null);

    // Simular estado de API
    const apiStatus = { online: true, latency: '24ms' };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const pageMeta = {
        '/': {
            title: 'Dashboard HMR',
            icon: LayoutDashboard,
        },
        '/reception/reservas': {
            title: 'Recepción',
            icon: Hotel,
        },
        '/housekeeping/lenceria': {
            title: 'Lencería',
            icon: Hotel,
        },
        '/maintenance/rooms': {
            title: 'Control de Cerraduras',
            icon: DoorOpen,
        },
        '/security/vehicle-control': {
            title: 'Control de Vehículos',
            icon: Shield,
        },
        '/signatures': {
            title: 'Firmas Corporativas',
            icon: FileSignature,
        },
        '/settings': {
            title: 'Configuración',
            icon: SettingsIcon,
        },
        
    };

    const currentPage = (() => {
        if (pageMeta[location.pathname]) {
            return pageMeta[location.pathname];
        }

        if (location.pathname.startsWith('/maintenance/room/')) {
            return pageMeta['/maintenance/rooms'];
        }

        return null;
    })();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
        }

        if (isProfileOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isProfileOpen]);

    return (
        <header className="sticky top-0 z-30 h-16 bg-[var(--color-bg-primary)]/80 backdrop-blur-md border-b border-[var(--color-border)] px-6 flex items-center justify-between">
            {/* Mobile menu button */}
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] md:hidden"
                    aria-label={isMobileSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
                >
                    {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                {currentPage && (
                    <div className="flex min-w-0 items-center gap-2 sm:-ml-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] shrink-0">
                            <currentPage.icon className="h-4 w-4" />
                        </div>
                        <p className="truncate text-sm font-semibold leading-none text-[var(--color-text-primary)] sm:text-base lg:text-lg">
                            {currentPage.title}
                        </p>
                    </div>
                )}
            </div>

            {/* Right Section: Utilities & Profile */}
            <div className="flex items-center gap-4">
                {/* API Status Indicator */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-tertiary)] rounded-full border border-[var(--color-border)]">
                    <div className="relative flex items-center justify-center w-2.5 h-2.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                        API v1.0 • {apiStatus.latency}
                    </span>
                </div>



                {/* Notifications */}
                <button className="relative p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-primary)] rounded-full border-2 border-[var(--color-bg-primary)]"></span>
                </button>

                {/* Divider */}
                <div className="h-6 w-px bg-[var(--color-border)] mx-1"></div>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-[var(--color-bg-tertiary)] transition-colors border border-transparent hover:border-[var(--color-border)]"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px]">
                            <div className="w-full h-full rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
                                <span className="font-bold text-xs text-white">{user?.full_name?.charAt(0) || 'U'}</span>
                            </div>
                        </div>
                        <div className="hidden md:flex flex-col items-start mr-1">
                            <span className="text-xs font-semibold text-[var(--color-text-primary)] leading-none">{user?.full_name || 'Admin'}</span>
                            <span className="text-[10px] text-[var(--color-text-muted)] leading-none mt-1">Admin</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden">
                            <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-bg-tertiary)]/30">
                                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                    {user?.full_name || 'Administrador'}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                                    {user?.email}
                                </p>
                            </div>
                            <div className="p-1">
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] rounded-lg transition-colors">
                                    <Activity className="w-4 h-4" />
                                    Logs
                                </button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] rounded-lg transition-colors">
                                    <Github className="w-4 h-4" />
                                    Soporte
                                </button>
                                <div className="h-px bg-[var(--color-border)] my-1 mx-2"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 rounded-lg transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
