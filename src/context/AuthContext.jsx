import { createContext, useContext, useState, useEffect } from 'react';

/**
 * AuthContext - Contexto de autenticación global
 * Conecta con el backend FastAPI para login, registro y verificación de sesión.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Verificar sesión al cargar (re-validar JWT con el backend)
    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                    localStorage.setItem('user', JSON.stringify(data.user));
                } else {
                    // Token inválido o expirado
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                }
            } catch {
                // Backend no disponible, usar datos locales como fallback
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    try {
                        setUser(JSON.parse(savedUser));
                    } catch {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                    }
                }
            } finally {
                setIsLoading(false);
            }
        };

        verifySession();
    }, []);

    /**
     * Iniciar sesión vía API
     */
    const login = async (email, password) => {
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const text = await res.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error('El servidor no respondió correctamente. Verifica que el backend esté corriendo.');
            }

            if (!res.ok) {
                throw new Error(data.detail || 'Error al iniciar sesión');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);

            return { success: true };
        } catch (err) {
            const message = err.message || 'Error al iniciar sesión';
            setError(message);
            return { success: false, error: message };
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Registrar nuevo usuario vía API
     */
    const register = async (fullName, email, password) => {
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: fullName, email, password }),
            });

            const text = await res.text();
            let data;
            try {
                data = text ? JSON.parse(text) : {};
            } catch {
                throw new Error('El servidor no respondió correctamente. Verifica que el backend esté corriendo.');
            }

            if (!res.ok) {
                throw new Error(data.detail || 'Error al registrar usuario');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);

            return { success: true };
        } catch (err) {
            const message = err.message || 'Error al registrar usuario';
            setError(message);
            return { success: false, error: message };
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Cerrar sesión
     */
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    /**
     * Get authentication headers for API requests
     */
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

    /**
     * Make authenticated API request
     */
    const apiFetch = async (url, options = {}) => {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };
        
        const response = await fetch(url, {
            ...options,
            headers,
        });
        
        // Handle 401 by logging out
        if (response.status === 401) {
            logout();
        }
        
        return response;
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        register,
        logout,
        getAuthHeaders,
        apiFetch,
        clearError: () => setError(null),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * Hook para usar el contexto de autenticación
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}

// AuthContext is not exported directly - use useAuth() hook instead
