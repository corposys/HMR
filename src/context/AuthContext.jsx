import { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

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
                    const userData = {
                        ...data.user,
                        role_id: data.user.role_id || data.user_role_id,
                        permissions: data.user.permissions || data.user.permissions || {},
                    };
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                }
            } catch {
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

            const userData = {
                ...data.user,
                role_id: data.user.role_id,
                permissions: data.user.permissions || {},
            };
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return { success: true };
        } catch (err) {
            const message = err.message || 'Error al iniciar sesión';
            setError(message);
            return { success: false, error: message };
        } finally {
            setIsLoading(false);
        }
    };

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

            const userData = {
                ...data.user,
                role_id: data.user.role_id,
                permissions: data.user.permissions || {},
            };
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);

            return { success: true };
        } catch (err) {
            const message = err.message || 'Error al registrar usuario';
            setError(message);
            return { success: false, error: message };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    };

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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
}