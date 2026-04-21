import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { AuthProvider } from '@context/AuthContext';
import { ToastProvider } from '@context/ToastContext';
import ProtectedRoute from '@shared/common/ProtectedRoute';
import Layout from '@shared/layout/Layout';
import { publicRoutes, protectedRoutes, fallbackRoute } from '@app/routes';

function RouteFallback() {
    return (
        <div className="min-h-[40vh] flex items-center justify-center p-6 text-[var(--color-text-muted)]">
            Cargando módulo...
        </div>
    );
}

/**
 * App - Componente raíz de la aplicación
 * Enrutamiento con React Router v7
 * AuthProvider envuelve toda la aplicación para gestión de autenticación
 */
function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <Suspense fallback={<RouteFallback />}>
                        <Routes>
                            {publicRoutes.map((route) => (
                                <Route key={route.path} path={route.path} element={route.element} />
                            ))}

                            {/* Rutas protegidas */}
                            <Route
                                path="/"
                                element={
                                    <ProtectedRoute>
                                        <Layout />
                                    </ProtectedRoute>
                                }
                            >
                                {protectedRoutes.map((route) => (
                                    route.index
                                        ? <Route key="index" index element={route.element} />
                                        : <Route key={route.path} path={route.path} element={route.element} />
                                ))}
                            </Route>

                            <Route path={fallbackRoute.path} element={fallbackRoute.element} />
                        </Routes>
                    </Suspense>
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    );
}

export default App;
