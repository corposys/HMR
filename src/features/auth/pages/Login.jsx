import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock } from 'lucide-react';
import { useAuth } from '@context/AuthContext';
import AuthLayout from '@features/auth/components/AuthLayout';
import Input from '@shared/common/Input';
import Button from '@shared/common/Button';
import Alert from '@shared/common/Alert';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const { login, isLoading, error } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (!email || !password) {
            setLocalError('Por favor completa todos los campos');
            return;
        }

        const result = await login(email, password);
        if (result.success) {
            navigate('/');
        }
    };

    const displayError = localError || error;

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
                        Bienvenido
                    </h2>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        Inicia sesión en tu cuenta
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {displayError && (
                        <Alert type="error">{displayError}</Alert>
                    )}

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

                    <Input
                        label="Contraseña"
                        icon={Lock}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={isLoading}
                    />

                    <Button type="submit" variant="primary" loading={isLoading} className="w-full">
                        Iniciar Sesión
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-[var(--color-text-muted)]">
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" className="text-[var(--color-primary)] hover:underline font-medium">
                        Crear una cuenta
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}