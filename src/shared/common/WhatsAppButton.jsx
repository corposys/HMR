import { MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '@utils/api';

export default function WhatsAppButton() {
    const [whatsappNumber, setWhatsappNumber] = useState('');

    useEffect(() => {
        apiFetch('/api/settings')
            .then((data) => {
                const reservationSettings = data.settings?.reservations || [];
                const whatsapp = reservationSettings.find(s => s.key === 'whatsapp_number');
                if (whatsapp?.value) {
                    setWhatsappNumber(whatsapp.value.replace(/\D/g, ''));
                }
            })
            .catch(() => {
                const saved = localStorage.getItem('settingsCache');
                if (saved) {
                    try {
                        const settings = JSON.parse(saved);
                        const reservationSettings = settings?.reservations || [];
                        const whatsapp = reservationSettings.find(s => s.key === 'whatsapp_number');
                        if (whatsapp?.value) {
                            setWhatsappNumber(whatsapp.value.replace(/\D/g, ''));
                        }
                    } catch {
                        // ignore
                    }
                }
            });
    }, []);

    if (!whatsappNumber) return null;

    const message = encodeURIComponent('Hola, me gustaría cotizar una habitación');

    return (
        <a
            href={`https://wa.me/${whatsappNumber}?text=${message}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="Contactar por WhatsApp"
            title="Cotiza por WhatsApp"
        >
            <MessageCircle className="w-7 h-7 text-white" />
        </a>
    );
}