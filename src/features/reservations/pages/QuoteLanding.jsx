import { useState, useEffect } from 'react';
import { Calendar, Users, BedDouble, Phone, Mail, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '@shared/common/Button';
import Input from '@shared/common/Input';
import Card from '@shared/common/Card';
import { apiFetch } from '@utils/api';

export default function QuoteLanding() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [roomTypes, setRoomTypes] = useState([]);
    const [formData, setFormData] = useState({
        checkin_date: '',
        checkout_date: '',
        guests: 2,
        room_type: '',
        guest_name: '',
        guest_phone: '',
        guest_email: '',
        notes: '',
    });

    useEffect(() => {
        apiFetch('/api/settings/room-types')
            .then(data => setRoomTypes(data.room_types || []))
            .catch(() => setRoomTypes([]));
    }, []);

    function handleChange(field, value) {
        setFormData(prev => ({ ...prev, [field]: value }));
    }

    async function handleSubmit() {
        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const payload = {
                source: 'whatsapp',
                checkin_date: formData.checkin_date,
                checkout_date: formData.checkout_date,
                guests: formData.guests,
                room_type_id: formData.room_type,
                guest_name: formData.guest_name,
                guest_phone: formData.guest_phone,
                guest_email: formData.guest_email,
                notes: formData.notes,
                status: 'pending_quote',
            };

            await apiFetch('/api/reception/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            setSubmitResult({ success: true });
            setStep(3);
        } catch (err) {
            setSubmitResult({ success: false, message: err.message || 'Error al procesar solicitud' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const isStep1Valid = formData.checkin_date && formData.checkout_date && formData.guests && formData.room_type;
    const isStep2Valid = formData.guest_name && formData.guest_phone;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <BedDouble className="w-16 h-16 mx-auto mb-4 text-amber-400" />
                    <h1 className="text-3xl font-bold text-white mb-2">Hotel Margarita Real</h1>
                    <p className="text-slate-400">Solicita tu cotización ahora</p>
                </div>

                <Card className="bg-white/10 backdrop-blur border border-white/20">
                    <div className="p-6 space-y-6">
                        {step === 1 && (
                            <>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">1</div>
                                    <span className="text-white font-medium">Fechas y habitación</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Fecha de entrada"
                                        type="date"
                                        icon={Calendar}
                                        value={formData.checkin_date}
                                        onChange={(e) => handleChange('checkin_date', e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    <Input
                                        label="Fecha de salida"
                                        type="date"
                                        icon={Calendar}
                                        value={formData.checkout_date}
                                        onChange={(e) => handleChange('checkout_date', e.target.value)}
                                        min={formData.checkin_date || new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">Huéspedes</label>
                                        <select
                                            value={formData.guests}
                                            onChange={(e) => handleChange('guests', parseInt(e.target.value))}
                                            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            {[1,2,3,4,5,6].map(n => (
                                                <option key={n} value={n} className="bg-slate-800">{n} huésped{n > 1 ? 'es' : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-300 mb-1">Tipo de habitación</label>
                                        <select
                                            value={formData.room_type}
                                            onChange={(e) => handleChange('room_type', e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        >
                                            <option value="" className="bg-slate-800">Seleccionar...</option>
                                            {roomTypes.map(rt => (
                                                <option key={rt.id} value={rt.id} className="bg-slate-800">{rt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => isStep1Valid && setStep(2)}
                                    disabled={!isStep1Valid}
                                    className="w-full"
                                    size="lg"
                                >
                                    Continuar
                                </Button>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">2</div>
                                    <span className="text-white font-medium">Tus datos de contacto</span>
                                </div>

                                <Input
                                    label="Nombre completo"
                                    icon={FileText}
                                    value={formData.guest_name}
                                    onChange={(e) => handleChange('guest_name', e.target.value)}
                                    placeholder="Juan Pérez"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Teléfono"
                                        icon={Phone}
                                        type="tel"
                                        value={formData.guest_phone}
                                        onChange={(e) => handleChange('guest_phone', e.target.value)}
                                        placeholder="0412-1234567"
                                    />
                                    <Input
                                        label="Email (opcional)"
                                        icon={Mail}
                                        type="email"
                                        value={formData.guest_email}
                                        onChange={(e) => handleChange('guest_email', e.target.value)}
                                        placeholder="juan@email.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-300 mb-1">Notas adicionales (opcional)</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => handleChange('notes', e.target.value)}
                                        placeholder="Solicitudes especiales..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                    />
                                </div>

                                {submitResult && !submitResult.success && (
                                    <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{submitResult.message}</span>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                                        Atrás
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!isStep2Valid || isSubmitting}
                                        loading={isSubmitting}
                                        icon={Send}
                                        className="flex-1"
                                    >
                                        Solicitar Cotización
                                    </Button>
                                </div>
                            </>
                        )}

                        {step === 3 && submitResult?.success && (
                            <div className="text-center py-8">
                                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                                <h2 className="text-xl font-bold text-white mb-2">¡Solicitud Enviada!</h2>
                                <p className="text-slate-300 mb-4">
                                    Te contactaremos pronto por WhatsApp para confirmar tu cotización.
                                </p>
                                <Button variant="secondary" onClick={() => { setStep(1); setSubmitResult(null); }}>
                                    Nueva Cotización
                                </Button>
                            </div>
                        )}
                    </div>
                </Card>

                <p className="text-center text-slate-500 text-sm mt-6">
                    © {new Date().getFullYear()} Hotel Margarita Real. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}