import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import WhatsAppButton from '@shared/common/WhatsAppButton';

/**
 * Layout - Contenedor principal de la aplicación (Sidebar + Topbar)
 */
export default function Layout() {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const closeMobileSidebar = useCallback(() => {
        setIsMobileSidebarOpen(false);
    }, []);

    const toggleMobileSidebar = useCallback(() => {
        setIsMobileSidebarOpen((current) => !current);
    }, []);

    return (
        <div className="flex h-screen w-full bg-[var(--color-bg-primary)] overflow-hidden">
            {/* Sidebar Navigation*/}
            {isMobileSidebarOpen && (
                <button
                    type="button"
                    aria-label="Cerrar menú lateral"
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px] md:hidden"
                    onClick={closeMobileSidebar}
                />
            )}
            <Sidebar isMobileOpen={isMobileSidebarOpen} onCloseMobile={closeMobileSidebar} />

            {/* Main Content Wrapper*/}
            <div className="flex-1 flex flex-col h-full min-w-0 md:pl-14">
                {/* Topbar */}
                <Navbar onMenuClick={toggleMobileSidebar} isMobileSidebarOpen={isMobileSidebarOpen} />

                {/* Content Area*/}
                <main className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)] scroll-smooth p-0 relative">
                    <Outlet />
                    <WhatsAppButton />
                </main>
            </div>
        </div>
    );
}
