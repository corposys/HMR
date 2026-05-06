import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@context/AuthContext';
import { ToastProvider } from '@context/ToastContext';
import ProtectedRoute from '@shared/common/ProtectedRoute';
import ErrorBoundary from '@shared/common/ErrorBoundary';
import Layout from '@shared/layout/Layout';
import { publicRoutes, protectedRoutes, fallbackRoute } from '@app/routes';

/**
 * App - Componente raíz de la aplicación
 * Enrutamiento con React Router v7
 * AuthProvider envuelve toda la aplicación para gestión de autenticación
 */
function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <ToastProvider>
                    <AuthProvider>
                        <Suspense fallback={(
                            <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
                                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
                            </div>
                        )}>
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
        </ErrorBoundary>
    );
}

export default App;
