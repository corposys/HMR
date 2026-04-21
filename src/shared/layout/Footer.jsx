import { Link } from 'react-router-dom';
import { Shield, Github, ExternalLink } from 'lucide-react';

/**
 * Footer - Pie de página minimalista
 */
export default function Footer() {
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        { name: 'Documentación', href: '/docs' },
        { name: 'Política de Privacidad', href: '/privacy' },
        { name: 'Código de Conducta', href: '/conduct' },
        { name: 'Seguridad', href: '/security' },
    ];

    return (
        <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <div className="container">
                {/* Sección superior con insignias de versión */}
                <div className="py-4 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)]">
                    <div className="flex items-center gap-3">
                        <span className="badge badge-primary">v1.0.0 Producción</span>
                        <span className="badge" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--color-success)' }}>
                            API Activa
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <a
                            href="#"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                {/* Sección inferior con enlaces */}
                <div className="py-4 flex flex-wrap items-center justify-between gap-4 text-sm">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        {footerLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.href}
                                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                        <Shield className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                        <span>© {currentYear} HMR System</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
