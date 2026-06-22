import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
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

            <p className="mt-10 text-center text-sm text-[var(--color-text-muted)]">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-[var(--color-primary)] hover:underline font-medium">
                    Crear una cuenta
                </Link>
            </p>
        </AuthLayout>
    );
}