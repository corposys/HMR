import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import AuthLayout from '@features/auth/components/AuthLayout';
import Input from '@shared/common/Input';
import Button from '@shared/common/Button';
import Alert from '@shared/common/Alert';

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
                <div className="text-center mb-6 lg:hidden">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-[var(--color-bg-secondary)] rounded-xl mb-3 border border-[var(--color-border)]">
                        <Shield className="w-7 h-7 text-[var(--color-primary)]" />
                    </div>
                    <h1 className="text-xl font-semibold">
                        HMR<span className="text-[var(--color-primary)]"> System</span>
                    </h1>
                </div>

                <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                        Crear Cuenta
                    </h2>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        Regístrate como administrador
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {displayError && (
                        <Alert type="error">{displayError}</Alert>
                    )}

                    <Input
                        label="Nombre completo"
                        icon={User}
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Juan Pérez"
                        autoComplete="name"
                        disabled={isLoading}
                    />

                    <Input
                        label="Correo electrónico"
                        icon={Mail}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@empresa.com"
                        autoComplete="email"
                        disabled={isLoading}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Contraseña"
                            icon={Lock}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            disabled={isLoading}
                        />
                        <Input
                            label="Confirmar"
                            icon={Lock}
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            autoComplete="new-password"
                            disabled={isLoading}
                        />
                    </div>

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

                    <Button type="submit" variant="primary" loading={isLoading} className="w-full">
                        Crear Cuenta
                    </Button>
                </form>

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