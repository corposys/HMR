export default function UsersTab() {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Usuarios y Roles</h3>
            <p className="text-[var(--color-text-secondary)]">Administración de acceso al dashboard HMR.</p>
            <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
                <p>
                    Usuarios Activos: <strong>12</strong>
                </p>
                <p>
                    Roles Definidos: <strong>5</strong>
                </p>
            </div>
        </div>
    );
}
