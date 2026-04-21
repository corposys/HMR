import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * Layout - Contenedor principal de la aplicación (Sidebar + Topbar)
 */
export default function Layout() {
    return (
        <div className="flex h-screen w-full bg-[var(--color-bg-primary)] overflow-hidden">
            {/* Sidebar Navigation*/}
            <Sidebar />

            {/* Main Content Wrapper*/}
            <div className="flex-1 flex flex-col h-full min-w-0">
                {/* Topbar */}
                <Navbar />

                {/* Content Area*/}
                <main className="flex-1 overflow-y-auto bg-[var(--color-bg-primary)] scroll-smooth p-0 relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
