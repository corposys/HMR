import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import AuthLayout from '@features/auth/components/AuthLayout';

/**
 * Register - Página de registro de nuevos administradores
 * Usa AuthLayout para consistencia con login
 */
export default function Register() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const { register, isLoading, error } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!fullName || !email || !password || !confirmPassword) {
            setLocalError('Por favor completa todos los campos');
            return;
        }

        if (password.length < 8) {
            setLocalError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setLocalError('Las contraseñas no coinciden');
            return;
        }

        const result = await register(fullName, email, password);
        if (result.success) {
            navigate('/');
        }
    };

    const displayError = localError || error;

    const passwordChecks = [
        { check: password.length >= 8, label: 'Mínimo 8 caracteres' },
        { check: password === confirmPassword && confirmPassword.length > 0, label: 'Las contraseñas coinciden' },
    ];

    return (
        <AuthLayout>
            <div className="w-full max-w-md">
                {/* Logo móvil */}
                <div className="text-center mb-6 lg:hidden">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--color-bg-secondary)] rounded-xl mb-3 border border-[var(--color-border)]">
                        <Shield className="w-7 h-7 text-[var(--color-primary)]" />
                    </div>
                    <h1 className="text-xl font-semibold">
                        HMR<span className="text-[var(--color-primary)]"> System</span>
                    </h1>
                </div>

                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                        Crear Cuenta
                    </h2>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        Regístrate como administrador
                    </p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {displayError && (
                        <div className="flex items-center gap-3 p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg text-[var(--color-danger)]">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{displayError}</p>
                        </div>
                    )}

                    {/* Full Name */}
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                            Nombre completo
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                            <input
                                id="fullName"
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                placeholder="Juan Pérez"
                                autoComplete="name"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                            Correo electrónico
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                placeholder="admin@empresa.com"
                                autoComplete="email"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Grid de contraseñas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                                Confirmar
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Password checks */}
                    {password.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                            {passwordChecks.map((item, index) => (
                                <div key={index} className="flex items-center gap-1.5 text-xs">
                                    <CheckCircle
                                        className={`w-3.5 h-3.5 ${item.check
                                            ? 'text-[var(--color-success)]'
                                            : 'text-[var(--color-text-muted)]'
                                            }`}
                                    />
                                    <span className={
                                        item.check
                                            ? 'text-[var(--color-success)]'
                                            : 'text-[var(--color-text-muted)]'
                                    }>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full py-2.5 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creando cuenta...
                            </>
                        ) : (
                            'Crear Cuenta'
                        )}
                    </button>
                </form>

                {/* Login link */}
                <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="text-[var(--color-primary)] hover:underline font-medium">
                        Iniciar Sesión
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
