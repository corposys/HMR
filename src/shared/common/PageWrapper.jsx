export default function PageWrapper({ children, className = '' }) {
    return (
        <div className={`py-5 w-full px-5 ${className}`}>
            <div className="mx-auto max-w-auto space-y-4">
                {children}
            </div>
        </div>
    );
}