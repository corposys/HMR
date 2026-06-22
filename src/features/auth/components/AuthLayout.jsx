/**
 * AuthLayout - Shared layout for authentication pages (Login/Register)
 * Two-column layout on desktop with branding on the left
 */
export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-bg-primary)] p-6">
            <div className="w-full max-w-md flex flex-col items-center">
                <div className="mb-8 text-center">
                    <img 
                        src="/img/logo-hmr-main.png" 
                        alt="Margarita Real" 
                        className="w-64 h-auto mx-auto"
                    />
                </div>
                <div className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-8 shadow-sm">
                    {children}
                </div>
            </div>
        </div>
    );
}
