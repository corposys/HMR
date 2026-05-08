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
    SettingsIcon,
    BedDouble,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    LayoutGrid,
    CalendarCheck,
    Sun,
    Moon,
} from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import { useTheme } from '@context/ThemeContext';
import { apiFetch } from '@utils/api';

/**
 * Navbar - Barra superior de utilidades (Topbar)
 * Contiene: Buscador, Estado, Notificaciones, Github, Perfil
 */
export default function Navbar({ onMenuClick, isMobileSidebarOpen }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const dropdownRef = useRef(null);
    const [bcvRate, setBcvRate] = useState(null);
    const [bcvLoading, setBcvLoading] = useState(false);
    const [bcvTrend, setBcvTrend] = useState('neutral');
    const [displayRate, setDisplayRate] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const animFrameRef = useRef(null);

    useEffect(() => {
        loadBcvRate();
        const interval = setInterval(loadBcvRate, 300000);
        return () => clearInterval(interval);
    }, []);

    function animateRate(from, to, trend) {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

        const duration = 800;
        const start = performance.now();
        setIsAnimating(true);
        if (trend) setBcvTrend(trend);

        function step(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = from + (to - from) * eased;
            setDisplayRate(current);

            if (progress < 1) {
                animFrameRef.current = requestAnimationFrame(step);
            } else {
                setIsAnimating(false);
            }
        }

        animFrameRef.current = requestAnimationFrame(step);
    }

    async function loadBcvRate() {
        try {
            const data = await apiFetch('/api/settings/bcv');
            if (data.rate) {
                const newRate = Number(data.rate.rate ?? data.rate);
                const oldRate = bcvRate ? Number(bcvRate.rate ?? bcvRate) : null;
                if (oldRate !== null && newRate !== oldRate) {
                    const trend = newRate > oldRate ? 'up' : 'down';
                    animateRate(oldRate, newRate, trend);
                } else {
                    setDisplayRate(newRate);
                    if (oldRate === null) setBcvTrend('neutral');
                }
                setBcvRate(data.rate);
            }
        } catch {
            // silently fail
        }
    }

    async function refreshBcvRate() {
        setBcvLoading(true);
        try {
            const data = await apiFetch('/api/settings/bcv/refresh', { method: 'POST' });
            if (data.rate) {
                const newRate = Number(data.rate.rate ?? data.rate);
                const oldRate = bcvRate ? Number(bcvRate.rate ?? bcvRate) : null;
                if (oldRate !== null && newRate !== oldRate) {
                    const trend = newRate > oldRate ? 'up' : 'down';
                    animateRate(oldRate, newRate, trend);
                } else {
                    setDisplayRate(newRate);
                }
                setBcvRate(data.rate);
            }
        } catch {
            // silently fail
        } finally {
            setBcvLoading(false);
        }
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const pageMeta = {
        '/': {
            title: 'Dashboard HMR',
            icon: LayoutDashboard,
        },
        '/rack': {
            title: 'Rack Operativo',
            icon: LayoutGrid,
        },
        '/reservaciones': {
            title: 'Reservaciones',
            icon: CalendarCheck,
        },
        '/reservaciones/tarifario': {
            title: 'Tarifario',
            icon: CalendarCheck,
        },
        '/reception/reservas': {
            title: 'Recepción',
            icon: Hotel,
        },
        '/housekeeping/lenceria': {
            title: 'Lencería',
            icon: Hotel,
        },
        '/systems/rooms': {
            title: 'Control de Cerraduras',
            icon: DoorOpen,
        },
        '/maintenance': {
            title: 'Habitaciones',
            icon: BedDouble,
        },
        '/maintenance/habitaciones': {
            title: 'Habitaciones',
            icon: BedDouble,
        },
        '/security/vehicle-control': {
            title: 'Control de Vehículos',
            icon: Shield,
        },
        '/systems/signatures': {
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

        if (location.pathname.startsWith('/systems/room/')) {
            return pageMeta['/systems/rooms'];
        }

        if (location.pathname.startsWith('/maintenance/habitaciones')) {
            return pageMeta['/maintenance/habitaciones'];
        }

        if (location.pathname.startsWith('/systems/signatures/')) {
            return pageMeta['/systems/signatures'];
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
        <header className="sticky top-0 z-30 h-14 bg-[var(--color-bg-primary)]/80 backdrop-blur-md border-b border-[var(--color-border)] px-4 flex items-center justify-between">
            {/* Mobile menu button */}
            <div className="flex min-w-0 items-center gap-2">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] md:hidden"
                    aria-label={isMobileSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
                >
                    {isMobileSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </button>

                {currentPage && (
                    <div className="hidden lg:flex min-w-0 items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] shrink-0">
                            <currentPage.icon className="h-3.5 w-3.5" />
                        </div>
                        <p className="truncate text-sm font-semibold leading-none text-[var(--color-text-primary)]">
                            {currentPage.title}
                        </p>
                    </div>
                )}
            </div>

            {/* Right Section: Utilities & Profile */}
            <div className="flex items-center gap-3">
                {/* BCV Rate Indicator */}
                <button
                    onClick={refreshBcvRate}
                    disabled={bcvLoading}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-full border bg-[var(--color-bg-tertiary)] border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-colors"
                    title="Clic para actualizar tasa BCV"
                >
                    {bcvTrend === 'down' ? (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                    ) : (
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                    )}
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                        <span className="hidden sm:inline">TASA BCV - </span>
                        <span className={`${isAnimating && bcvTrend === 'up' ? 'text-emerald-400' : isAnimating && bcvTrend === 'down' ? 'text-red-400' : 'text-[var(--color-text-primary)]'}`}>
                            {displayRate !== null ? `$${displayRate.toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : '—'}
                        </span>
                    </span>
                    <RefreshCw className={`w-2.5 h-2.5 text-[var(--color-text-muted)] ${bcvLoading ? 'animate-spin' : ''}`} />
                </button>

                {/* Notifications */}
                <button className="relative p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors">
                    <Bell className="w-4 h-4" />
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full border-2 border-[var(--color-bg-primary)]"></span>
                </button>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-full transition-colors"
                    title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Divider */}
                <div className="h-5 w-px bg-[var(--color-border)]"></div>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 pl-1.5 pr-1 py-0.5 rounded-full hover:bg-[var(--color-bg-tertiary)] transition-colors border border-transparent hover:border-[var(--color-border)]"
                    >
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px]">
                            <div className="w-full h-full rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center">
                                <span className="font-bold text-[10px] text-white">{user?.full_name?.charAt(0) || 'U'}</span>
                            </div>
                        </div>
                        <div className="hidden md:flex flex-col items-start">
                            <span className="text-xs font-semibold text-[var(--color-text-primary)] leading-none">{user?.full_name || 'Admin'}</span>
                            <span className="text-[10px] text-[var(--color-text-muted)] leading-none mt-0.5">Admin</span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
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
