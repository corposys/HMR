import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SignatureInstructions() {
    return (
        <div className="bg-[#0f7681]/10 border border-[#0f7681]/20 rounded-xl p-4 flex gap-3">
            <SettingsIcon className="w-5 h-5 text-[#0f7681] shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--color-text-secondary)]">
                <p className="font-medium text-[#0f7681] mb-1">Instrucciones de uso:</p>
                <ol className="list-decimal pl-4 space-y-1">
                    <li>Completa tus datos personales en el formulario de la izquierda.</li>
                    <li>Haz clic en <strong>Descargar</strong> para guardar la imagen de la firma en tu dispositivo.</li>
                    <li>Abre la configuración de firmas de tu cliente de correo (Outlook, Gmail).</li>
                    <li>Inserta la imagen descargada en el espacio de la firma.</li>
                    <li>Guarda los cambios.</li>
                </ol>
            </div>
        </div>
    );
}
