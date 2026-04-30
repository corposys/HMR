import React, { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileSignature, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';

import SignatureForm from '@features/signatures/components/SignatureForm';
import SignaturePreview from '@features/signatures/components/SignaturePreview';
import SignatureInstructions from '@features/signatures/components/SignatureInstructions';
import { useToast } from '@context/ToastContext';

export default function Signatures() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useToast();

    // ==== ESTADO DEL FORMULARIO ====
    const [formData, setFormData] = useState({
        fullName: searchParams.get('fullName') || '',
        jobTitle: searchParams.get('jobTitle') || '',
        email: searchParams.get('email') || '',
        extension: searchParams.get('extension') || '',
        mobilePhone: searchParams.get('mobilePhone') || '',
    });

    const [currentId, setCurrentId] = useState(searchParams.get('id') || null);
    const placeholders = {
        fullName: 'NOMBRE APELLIDO',
        jobTitle: 'CARGO',
        email: 'correo@margaritareal.com.ve',
        extension: '0000',
        mobilePhone: '+58 414-0000000',
    };

    const [isDownloading, setIsDownloading] = useState(false);
    const signatureRef = useRef(null);

    const fixedData = {
        officePhone: 'Ofic: +58 0295-5001300',
        website: 'www.hotelmargaritareal.com',
        address: 'Av. Aldonza Manrique, Final Calle Camarón, Hotel Margarita Real. Ofc. Admin. Pampatar, Edo. Nueva Esparta. Venezuela 6316'
    };

    const isFormValid = formData.fullName.trim() !== '' && 
                        formData.jobTitle.trim() !== '' && 
                        formData.email.trim() !== '' && 
                        formData.extension.trim() !== '';

    const handleDownload = async () => {
        if (!signatureRef.current || !isFormValid) return;
        setIsDownloading(true);

        try {
            const element = signatureRef.current;
            const outerTable = element.querySelector('table');
            const dataTd = outerTable.querySelectorAll('tr > td')[2];

            const origHeight = outerTable.style.height;
            const origMaxHeight = outerTable.style.maxHeight;
            const origPadding = dataTd ? dataTd.style.padding : '';

            // Ocultar placeholders de exportación
            const placeholdersToHide = element.querySelectorAll('.export-hide');
            const originalDisplays = [];
            placeholdersToHide.forEach(el => {
                originalDisplays.push(el.style.display);
                el.style.display = 'none';
            });

            outerTable.style.height = 'auto';
            outerTable.style.maxHeight = 'none';
            if (dataTd) dataTd.style.padding = '8px 0 0 10px';

            const canvas = await html2canvas(element, {
                width: 567,
                height: 128,
                scale: 1,
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true
            });

            outerTable.style.height = origHeight;
            outerTable.style.maxHeight = origMaxHeight;
            if (dataTd) dataTd.style.padding = origPadding;

            // Restaurar placeholders
            placeholdersToHide.forEach((el, index) => {
                el.style.display = originalDisplays[index];
            });

            const image = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            link.href = image;
            link.download = `firma_${formData.fullName.replace(/\s+/g, '_').toLowerCase() || 'colaborador'}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Guardar en DB
            if (formData.fullName && formData.jobTitle) {
                try {
                    const token = localStorage.getItem('token');
                    const endpoint = currentId ? `/api/signatures/${currentId}` : '/api/signatures';
                    const method = currentId ? 'PUT' : 'POST';

                    const res = await fetch(endpoint, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            full_name: formData.fullName,
                            job_title: formData.jobTitle,
                            email: formData.email,
                            mobile_phone: formData.mobilePhone || null,
                            extension: formData.extension || null,
                        }),
                    });

                    if (!res.ok) throw new Error('Error saving signature');
                    const data = await res.json();

                    // Si era nuevo, actualizamos el ID actual para futuras descargas
                    if (!currentId && data.signature?.id) {
                        setCurrentId(data.signature.id);
                        setSearchParams(prev => {
                            prev.set('id', data.signature.id);
                            return prev;
                        }, { replace: true });
                    }

                    showToast({
                        type: 'success',
                        title: 'Firma guardada',
                        message: 'La firma se guardó correctamente en el historial.',
                    });
                } catch {
                    showToast({
                        type: 'error',
                        title: 'No se pudo guardar',
                        message: 'La descarga sí funcionó, pero falló el guardado en historial.',
                    });
                }
            }

            setIsDownloading(false);
        } catch (err) {
            console.error('Failed to download image', err);
            showToast({
                type: 'error',
                title: 'Error al descargar',
                message: 'No se pudo generar la imagen de la firma. Intenta nuevamente.',
            });
            setIsDownloading(false);
        }
    };

    const handleClear = () => {
        setFormData({
            fullName: '',
            jobTitle: '',
            email: '',
            extension: '',
            mobilePhone: ''
        });
        setCurrentId(null);
        setSearchParams(new URLSearchParams(), { replace: true });
    };

    return (
        <div className="py-5 w-full px-5">
            <div className="mx-auto max-w-auto space-y-4">
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <button
                            onClick={() => navigate('/signatures')}
                            aria-label="Volver al historial"
                            title="Volver al historial"
                            className="p-2.5 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10">
                            <FileSignature className="w-6 h-6 text-[var(--color-primary)]" />
                        </div>
                        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
                            {currentId ? 'Editar Firma' : 'Nueva Firma'}
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* COLUMNA IZQUIERDA: Formulario */}
                    <SignatureForm 
                        formData={formData} 
                        setFormData={setFormData} 
                        handleClear={handleClear} 
                        fixedData={fixedData} 
                    />

                    {/* COLUMNA DERECHA: Vista Previa e Instrucciones */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <SignaturePreview 
                            formData={formData} 
                            fixedData={fixedData} 
                            placeholders={placeholders} 
                            isFormValid={isFormValid} 
                            isDownloading={isDownloading} 
                            handleDownload={handleDownload}
                            signatureRef={signatureRef} 
                        />
                        <SignatureInstructions />
                    </div>
                </div>
            </div>
        </div>
    );
}
