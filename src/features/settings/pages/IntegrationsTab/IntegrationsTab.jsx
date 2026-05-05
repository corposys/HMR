export default function IntegrationsTab() {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Integraciones</h3>
            <p className="text-[var(--color-text-secondary)]">Gestión de conexiones con otras aplicaciones.</p>
            <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)]">
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        Motor de Reservas <span className="text-green-500 ml-2">(Conectado)</span>
                    </li>
                    <li>
                        Sistema Housekeeping <span className="text-green-500 ml-2">(Conectado)</span>
                    </li>
                    <li>
                        POS Restaurante <span className="text-yellow-500 ml-2">(Sincronizando)</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
