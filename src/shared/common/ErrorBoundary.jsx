import { Component } from 'react';

/**
 * Error Boundary - Captures JavaScript errors anywhere in the child component tree
 * Prevents the entire app from crashing when a component fails
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)] p-6">
                    <div className="card max-w-lg w-full p-8 text-center">
                        <h2 className="text-2xl font-bold text-[var(--color-danger)] mb-4">
                            Algo salió mal
                        </h2>
                        <p className="text-[var(--color-text-secondary)] mb-6">
                            Lo sentimos, ha ocurrido un error inesperado. Por favor, recarga la página o contacta al soporte técnico.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn btn-primary"
                        >
                            Recargar página
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-[var(--color-text-muted)] text-sm">
                                    Ver detalles del error (solo desarrollo)
                                </summary>
                                <pre className="mt-2 p-4 bg-[var(--color-bg-tertiary)] rounded-lg text-xs text-[var(--color-text-secondary)] overflow-auto">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
