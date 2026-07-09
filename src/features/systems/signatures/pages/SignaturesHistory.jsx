import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toPng } from 'html-to-image';
import {
    FileSignature, Plus, Search, Trash2,
    Users, TrendingUp, X,
    UserPlus, History
} from 'lucide-react';
import { useToast } from '@context/ToastContext';
import { apiFetch, apiJson } from '@utils/api';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import ErrorState from '@shared/common/ErrorState';
import EmptyState from '@shared/common/EmptyState';
import PageWrapper from '@shared/common/PageWrapper';
import Button from '@shared/common/Button';
import { useSettings } from '@hooks/useSettings';
import {
    Card, CardHeader
} from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import SignatureForm from '@features/systems/signatures/components/SignatureForm';
import SignaturePreview from '@features/systems/signatures/components/SignaturePreview';
import SignatureInstructions from '@features/systems/signatures/components/SignatureInstructions';
import SignatureTable from '@features/systems/signatures/components/SignatureTable';

export default function SignaturesHistory() {
    const [searchParams, setSearchParams] = useSearchParams();
    const { showToast } = useToast();
    const { getSetting } = useSettings();

    // Tab principal (generator vs history)
    const [mainTab, setMainTab] = useState(searchParams.get('tab') || 'generator');

    // Estado del Formulario
    const [formData, setFormData] = useState({
        fullName: searchParams.get('fullName') || '',
        jobTitle: searchParams.get('jobTitle') || '',
        email: searchParams.get('email') || '',
        extension: searchParams.get('extension') || '',
        mobilePhone: searchParams.get('mobilePhone') || '',
    });
    const [currentId, setCurrentId] = useState(searchParams.get('id') || null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const signatureRef = useRef(null);

    // Constantes del formulario
    const placeholders = {
        fullName: 'NOMBRE APELLIDO',
        jobTitle: 'CARGO',
        email: 'correo@margaritareal.com.ve',
        extension: '0000',
        mobilePhone: '+58 414-0000000',
    };
    const fixedData = {
        officePhone: `Ofic: ${getSetting('hotel_phone', '+58 0295-5001300')}`,
        website: getSetting('hotel_website', 'www.hotelmargaritareal.com'),
        address: getSetting('hotel_address', 'Av. Aldonza Manrique, Final Calle Camarón, Hotel Margarita Real. Ofc. Admin. Pampatar, Edo. Nueva Esparta. Venezuela 6316'),
    };

    const isFormValid = formData.fullName.trim() !== '' &&
        formData.jobTitle.trim() !== '' &&
        formData.email.trim() !== '' &&
        formData.extension.trim() !== '';

    // Estado del Historial
    const [signatures, setSignatures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [historyFilterTab, setHistoryFilterTab] = useState('all');

    const fetchSignatures = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/api/signatures');
            setSignatures(data.signatures || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSignatures(); }, [fetchSignatures]);

    const handleDelete = async () => {
        if (!toDelete) return;
        setDeleting(true);
        try {
            await apiFetch(`/api/signatures/${toDelete.id}`, { method: 'DELETE' });
            setSignatures(prev => prev.filter(s => s.id !== toDelete.id));
            if (currentId === toDelete.id) {
                handleClear();
            }
            setToDelete(null);
            showToast({ title: 'Firma eliminada', message: 'La firma se eliminó correctamente.', type: 'success' });
        } catch {
            showToast({ title: 'Error', message: 'No se pudo eliminar la firma', type: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    const handleEdit = (sig) => {
        setFormData({
            fullName: sig.full_name,
            jobTitle: sig.job_title,
            email: sig.email,
            mobilePhone: sig.mobile_phone || '',
            extension: sig.extension || '',
        });
        setCurrentId(sig.id);

        const params = new URLSearchParams();
        params.set('tab', 'generator');
        params.set('id', sig.id);
        setSearchParams(params, { replace: true });
        setMainTab('generator');
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

        const params = new URLSearchParams();
        params.set('tab', 'generator');
        setSearchParams(params, { replace: true });
    };

    const persistSignature = async () => {
        if (!formData.fullName.trim() || !formData.jobTitle.trim()) {
            showToast({ type: 'warning', title: 'Datos incompletos', message: 'Completa nombre y cargo para guardar.' });
            return null;
        }
        const payload = {
            full_name: formData.fullName,
            job_title: formData.jobTitle,
            email: formData.email,
            mobile_phone: formData.mobilePhone || null,
            extension: formData.extension || null,
        };
        const endpoint = currentId ? `/api/signatures/${currentId}` : '/api/signatures';
        const method = currentId ? 'PUT' : 'POST';
        const data = await apiJson(endpoint, { method, body: payload });
        if (!currentId && data.signature?.id) {
            setCurrentId(data.signature.id);
        }
        return data;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await persistSignature();
            await fetchSignatures();
            showToast({
                type: 'success',
                title: 'Firma guardada',
                message: 'La firma se guardó en el historial.',
            });
        } catch (err) {
            showToast({
                type: 'error',
                title: 'No se pudo guardar',
                message: err.message || 'Intenta nuevamente.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!signatureRef.current || !isFormValid) return;
        setIsDownloading(true);

        try {
            const dataUrl = await toPng(signatureRef.current, {
                width: 567,
                height: 128,
                pixelRatio: 1,
                backgroundColor: '#ffffff',
                skipFonts: true,
            });

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `firma_${formData.fullName.replace(/\s+/g, '_').toLowerCase() || 'colaborador'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            try {
                await persistSignature();
                await fetchSignatures();
                showToast({
                    type: 'success',
                    title: 'Firma descargada y guardada',
                    message: 'La firma se descargó y se guardó en el historial.',
                });
            } catch (err) {
                showToast({
                    type: 'warning',
                    title: 'Firma descargada',
                    message: `La imagen se descargó, pero no se pudo guardar: ${err.message}`,
                });
            }
        } catch (err) {
            console.error('Failed to generate image', err);
            showToast({
                type: 'error',
                title: 'Error al descargar',
                message: 'No se pudo generar la imagen de la firma. Intenta nuevamente.',
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const thisMonth = signatures.filter(s => {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const filtered = signatures.filter(s => {
        const q = search.toLowerCase();
        return s.full_name.toLowerCase().includes(q) || s.job_title.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    });

    const tabFiltered = historyFilterTab === 'month'
        ? filtered.filter(s => {
            if (!s.created_at) return false;
            const d = new Date(s.created_at);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        : filtered;

    const visibleSignatures = [...tabFiltered].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <PageWrapper>
            <Tabs value={mainTab} onValueChange={(val) => {
                setMainTab(val);
                const params = new URLSearchParams(searchParams);
                params.set('tab', val);
                setSearchParams(params, { replace: true });
            }} className="w-full">
                <TabsList className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] mb-4">
                    <TabsTrigger value="generator" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> Generar Firma
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2">
                        <History className="w-4 h-4" /> Historial de Firmas
                    </TabsTrigger>
                </TabsList>

                {/* --- PESTAÑA: GENERADOR --- */}
                <TabsContent value="generator" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Columna Izquierda: Formulario */}
                        <div className="lg:col-span-1">
                            <SignatureForm
                                formData={formData}
                                setFormData={setFormData}
                                handleClear={handleClear}
                                fixedData={fixedData}
                            />
                        </div>
                        
                        {/* Columna Derecha: Preview + Instrucciones */}
                        <div className="lg:col-span-2 space-y-4">
                            <SignaturePreview
                                formData={formData}
                                fixedData={fixedData}
                                placeholders={placeholders}
                                isFormValid={isFormValid}
                                isDownloading={isDownloading}
                                isSaving={isSaving}
                                handleDownload={handleDownload}
                                handleSave={handleSave}
                                signatureRef={signatureRef}
                            />
                            <SignatureInstructions />
                        </div>
                    </div>
                </TabsContent>

                {/* --- PESTAÑA: HISTORIAL --- */}
                <TabsContent value="history" className="mt-0">
                    <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm mb-4">
                        <CardHeader className="py-3 px-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                {/* Izquierda: Título y Estadísticas Compactas */}
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                    <div className="flex items-center gap-2 border-r border-[var(--color-border)] pr-4">
                                        <History className="w-5 h-5 text-[var(--color-primary)]" />
                                        <span className="font-semibold text-sm text-[var(--color-text-primary)]">Historial</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs">
                                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                            <Users className="w-3.5 h-3.5 text-[#009098]" />
                                            <span><strong className="text-[var(--color-text-primary)]">{signatures.length}</strong> total</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                                            <TrendingUp className="w-3.5 h-3.5 text-[#0f7681]" />
                                            <span><strong className="text-[var(--color-text-primary)]">{thisMonth}</strong> este mes</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Derecha: Búsqueda, Filtros y Acciones */}
                                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                    <Tabs value={historyFilterTab} onValueChange={setHistoryFilterTab} className="w-auto h-8">
                                        <TabsList className="h-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border)]">
                                            <TabsTrigger value="all" className="h-full text-xs data-[state=active]:bg-[var(--color-bg-secondary)] data-[state=active]:text-[var(--color-text-primary)]">
                                                Todas
                                            </TabsTrigger>
                                            <TabsTrigger value="month" className="h-full text-xs data-[state=active]:bg-[var(--color-bg-secondary)] data-[state=active]:text-[var(--color-text-primary)]">
                                                Este mes
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>

                                    {signatures.length > 0 && (
                                        <div className="relative w-full sm:w-64 h-8">
                                            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                            <input
                                                type="text"
                                                value={search}
                                                onChange={e => setSearch(e.target.value)}
                                                placeholder="Buscar por nombre, cargo..."
                                                className="w-full h-full pl-8 pr-8 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                            />
                                            {search && (
                                                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]">
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    <Button variant="register" icon={Plus} size="sm" onClick={() => {
                                        handleClear();
                                        setMainTab('generator');
                                    }} className="h-8 text-xs">
                                        Nueva
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                    </Card>

                    {loading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <ErrorState message={error} onRetry={fetchSignatures} />
                    ) : signatures.length === 0 ? (
                        <EmptyState icon={FileSignature} title="No hay firmas guardadas" description="Crea la primera firma para empezar a usar el historial." actionLabel="Nueva firma" onAction={() => {
                            handleClear();
                            setMainTab('generator');
                        }} />
                    ) : tabFiltered.length === 0 ? (
                        <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-16 text-center text-sm text-[var(--color-text-secondary)] shadow-sm">
                            Sin resultados para <strong>"{search}"</strong>
                        </Card>
                    ) : (
                        <SignatureTable
                            signatures={visibleSignatures}
                            onEdit={handleEdit}
                            onDelete={setToDelete}
                        />
                    )}
                </TabsContent>
            </Tabs>

            <Dialog open={!!toDelete} onOpenChange={(open) => { if (!open) setToDelete(null); }}>
                <DialogContent className="bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-400" />
                            Eliminar firma
                        </DialogTitle>
                        <DialogDescription className="text-[var(--color-text-muted)]">
                            ¿Eliminar la firma de <strong>{toDelete?.full_name}</strong>? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="secondary" onClick={() => setToDelete(null)}>Cancelar</Button>
                        <Button variant="danger" onClick={handleDelete} loading={deleting} icon={Trash2}>Eliminar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageWrapper>
    );
}
