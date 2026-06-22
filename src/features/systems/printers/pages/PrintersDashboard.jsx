import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    Printer, Package, History, Plus, Search, Trash2, Edit2, 
    ExternalLink, ArrowUpRight, ArrowDownLeft, Laptop, Network,
    AlertTriangle, CheckCircle, Ban, RefreshCw, X, Loader2
} from 'lucide-react';
import { useToast } from '@context/ToastContext';
import { apiJson } from '@utils/api';
import LoadingSpinner from '@shared/common/LoadingSpinner';
import ErrorState from '@shared/common/ErrorState';
import PageWrapper from '@shared/common/PageWrapper';
import Button from '@shared/common/Button';
import CustomDropdown from '@shared/common/CustomDropdown';
import Modal from '@shared/common/Modal';
import { Card } from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const SEGMENT_OPTIONS = [
    { value: 'all', label: 'Todos los segmentos' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'corpo', label: 'Corpo' },
];

const OWNERSHIP_OPTIONS = [
    { value: 'all', label: 'Propiedad (Todas)' },
    { value: 'propia', label: 'Propia' },
    { value: 'alquilada', label: 'Alquilada' },
];

const HISTORY_TYPE_OPTIONS = [
    { value: 'all', label: 'Todos los movimientos' },
    { value: 'in', label: 'Entradas (Ingresos)' },
    { value: 'out', label: 'Salidas (Despachos)' },
];

export default function PrintersDashboard() {
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('printers');

    const [printers, setPrinters] = useState([]);
    const [toners, setToners] = useState([]);
    const [transactions, setTransactions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [printerSearch, setPrinterSearch] = useState('');
    const [printerSegment, setPrinterSegment] = useState('all');
    const [printerOwnership, setPrinterOwnership] = useState('all');

    const [tonerSearch, setTonerSearch] = useState('');

    const [historySearch, setHistorySearch] = useState('');
    const [historySegment, setHistorySegment] = useState('all');
    const [historyType, setHistoryType] = useState('all');

    const [showPrinterModal, setShowPrinterModal] = useState(false);
    const [editingPrinter, setEditingPrinter] = useState(null);
    const [printerForm, setPrinterForm] = useState({
        segment: 'hotel',
        ownership: 'propia',
        brand: '',
        model: '',
        serial_number: '',
        connection_type: 'usb',
        ip_address: '',
        has_scanner: false,
        location: '',
        status: 'operational'
    });

    const [showTonerModal, setShowTonerModal] = useState(false);
    const [editingToner, setEditingToner] = useState(null);
    const [tonerForm, setTonerForm] = useState({
        model_name: '',
        color: 'Negro',
        compatible_printers: ''
    });

    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [transactionMode, setTransactionMode] = useState('in');
    const [transactionForm, setTransactionForm] = useState({
        toner_model_id: '',
        segment: 'hotel',
        quantity: 1,
        printer_id: '',
        notes: ''
    });

    const [printerToDelete, setPrinterToDelete] = useState(null);
    const [tonerToDelete, setTonerToDelete] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [printersRes, tonersRes, transactionsRes] = await Promise.all([
                apiJson('/api/systems/printers'),
                apiJson('/api/systems/toners'),
                apiJson('/api/systems/toners/transactions')
            ]);
            setPrinters(printersRes.printers || []);
            setToners(tonersRes.toners || []);
            setTransactions(transactionsRes.transactions || []);
        } catch (err) {
            setError(err.message || 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSavePrinter = async (e) => {
        e.preventDefault();
        if (!printerForm.brand || !printerForm.model) {
            showToast({ title: 'Campos requeridos', message: 'Marca y Modelo son obligatorios', type: 'error' });
            return;
        }

        try {
            const payload = {
                ...printerForm,
                ip_address: printerForm.connection_type === 'red' ? printerForm.ip_address : ''
            };

            if (editingPrinter) {
                await apiJson(`/api/systems/printers/${editingPrinter.id}`, { method: 'PUT', body: payload });
                showToast({ title: 'Impresora actualizada', message: 'Se actualizaron los datos correctamente', type: 'success' });
            } else {
                await apiJson('/api/systems/printers', { method: 'POST', body: payload });
                showToast({ title: 'Impresora registrada', message: 'Se agregó la impresora al sistema', type: 'success' });
            }

            setShowPrinterModal(false);
            fetchData();
        } catch (err) {
            showToast({ title: 'Error', message: err.message || 'No se pudo guardar la impresora', type: 'error' });
        }
    };

    const handleSaveToner = async (e) => {
        e.preventDefault();
        if (!tonerForm.model_name || !tonerForm.color) {
            showToast({ title: 'Campos requeridos', message: 'Modelo y Color son obligatorios', type: 'error' });
            return;
        }

        try {
            if (editingToner) {
                await apiJson(`/api/systems/toners/${editingToner.id}`, { method: 'PUT', body: tonerForm });
                showToast({ title: 'Modelo actualizado', message: 'Se actualizaron los datos del toner', type: 'success' });
            } else {
                await apiJson('/api/systems/toners', { method: 'POST', body: tonerForm });
                showToast({ title: 'Modelo registrado', message: 'Se agregó el modelo de toner al catálogo', type: 'success' });
            }

            setShowTonerModal(false);
            fetchData();
        } catch (err) {
            showToast({ title: 'Error', message: err.message || 'No se pudo guardar el modelo de toner', type: 'error' });
        }
    };

    const handleSaveTransaction = async (e) => {
        e.preventDefault();
        if (!transactionForm.toner_model_id) {
            showToast({ title: 'Campo requerido', message: 'Debes seleccionar un modelo de toner', type: 'error' });
            return;
        }

        try {
            await apiJson('/api/systems/toners/transaction', {
                method: 'POST',
                body: {
                    toner_model_id: parseInt(transactionForm.toner_model_id),
                    type: transactionMode,
                    segment: transactionForm.segment,
                    quantity: transactionForm.quantity,
                    printer_id: transactionForm.printer_id ? parseInt(transactionForm.printer_id) : null,
                    notes: transactionForm.notes
                }
            });

            const actionWord = transactionMode === 'in' ? 'Ingreso' : 'Despacho';
            showToast({ 
                title: `${actionWord} registrado`, 
                message: `Se completó la transacción exitosamente`, 
                type: 'success' 
            });

            setShowTransactionModal(false);
            fetchData();
        } catch (err) {
            showToast({ title: 'Error', message: err.message || 'No se pudo registrar la transacción', type: 'error' });
        }
    };

    const handleDeletePrinter = async () => {
        if (!printerToDelete) return;
        try {
            await apiJson(`/api/systems/printers/${printerToDelete.id}`, { method: 'DELETE' });
            showToast({ title: 'Impresora eliminada', message: 'Se eliminó el registro de la impresora', type: 'success' });
            setPrinterToDelete(null);
            fetchData();
        } catch (err) {
            showToast({ title: 'Error', message: err.message || 'No se pudo eliminar la impresora', type: 'error' });
        }
    };

    const handleDeleteToner = async () => {
        if (!tonerToDelete) return;
        try {
            await apiJson(`/api/systems/toners/${tonerToDelete.id}`, { method: 'DELETE' });
            showToast({ title: 'Toner eliminado', message: 'Se eliminó el modelo de toner del catálogo', type: 'success' });
            setTonerToDelete(null);
            fetchData();
        } catch (err) {
            showToast({ title: 'Error', message: err.message || 'No se pudo eliminar el modelo de toner', type: 'error' });
        }
    };

    const openAddPrinter = () => {
        setEditingPrinter(null);
        setPrinterForm({
            segment: 'hotel',
            ownership: 'propia',
            brand: '',
            model: '',
            serial_number: '',
            connection_type: 'usb',
            ip_address: '',
            has_scanner: false,
            location: '',
            status: 'operational'
        });
        setShowPrinterModal(true);
    };

    const openEditPrinter = (printer) => {
        setEditingPrinter(printer);
        setPrinterForm({
            segment: printer.segment,
            ownership: printer.ownership,
            brand: printer.brand,
            model: printer.model,
            serial_number: printer.serial_number || '',
            connection_type: printer.connection_type,
            ip_address: printer.ip_address || '',
            has_scanner: printer.has_scanner || false,
            location: printer.location || '',
            status: printer.status
        });
        setShowPrinterModal(true);
    };

    const openAddToner = () => {
        setEditingToner(null);
        setTonerForm({
            model_name: '',
            color: 'Negro',
            compatible_printers: ''
        });
        setShowTonerModal(true);
    };

    const openEditToner = (toner) => {
        setEditingToner(toner);
        setTonerForm({
            model_name: toner.model_name,
            color: toner.color,
            compatible_printers: toner.compatible_printers || ''
        });
        setShowTonerModal(true);
    };

    const openTransaction = (mode, tonerModelId = '', segment = 'hotel') => {
        setTransactionMode(mode);
        setTransactionForm({
            toner_model_id: tonerModelId ? String(tonerModelId) : (toners.length > 0 ? String(toners[0].id) : ''),
            segment,
            quantity: 1,
            printer_id: '',
            notes: ''
        });
        setShowTransactionModal(true);
    };

    const filteredPrinters = useMemo(() => {
        return printers.filter(p => {
            const matchesSearch = 
                p.brand.toLowerCase().includes(printerSearch.toLowerCase()) ||
                p.model.toLowerCase().includes(printerSearch.toLowerCase()) ||
                (p.serial_number && p.serial_number.toLowerCase().includes(printerSearch.toLowerCase())) ||
                (p.location && p.location.toLowerCase().includes(printerSearch.toLowerCase()));
            
            const matchesSegment = printerSegment === 'all' || p.segment === printerSegment;
            const matchesOwnership = printerOwnership === 'all' || p.ownership === printerOwnership;

            return matchesSearch && matchesSegment && matchesOwnership;
        });
    }, [printers, printerSearch, printerSegment, printerOwnership]);

    const filteredToners = useMemo(() => {
        return toners.filter(t => {
            return t.model_name.toLowerCase().includes(tonerSearch.toLowerCase()) ||
                   t.color.toLowerCase().includes(tonerSearch.toLowerCase()) ||
                   (t.compatible_printers && t.compatible_printers.toLowerCase().includes(tonerSearch.toLowerCase()));
        });
    }, [toners, tonerSearch]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesSearch = 
                t.model_name.toLowerCase().includes(historySearch.toLowerCase()) ||
                (t.notes && t.notes.toLowerCase().includes(historySearch.toLowerCase())) ||
                (t.user_name && t.user_name.toLowerCase().includes(historySearch.toLowerCase())) ||
                (t.printer_name && t.printer_name.toLowerCase().includes(historySearch.toLowerCase()));

            const matchesSegment = historySegment === 'all' || t.segment === historySegment;
            const matchesType = historyType === 'all' || t.type === historyType;

            return matchesSearch && matchesSegment && matchesType;
        });
    }, [transactions, historySearch, historySegment, historyType]);

    const transactionCompatiblePrinters = useMemo(() => {
        return printers.filter(p => {
            const matchesSegment = p.segment === transactionForm.segment;
            const isActive = p.status !== 'out_of_service';
            return matchesSegment && isActive;
        });
    }, [printers, transactionForm.segment]);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && printers.length === 0) {
        return (
            <PageWrapper>
                <div className="flex items-center justify-center min-h-[400px]">
                    <LoadingSpinner />
                </div>
            </PageWrapper>
        );
    }

    if (error && printers.length === 0) {
        return (
            <PageWrapper>
                <ErrorState message={error} onRetry={fetchData} />
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] mb-4">
                    <TabsTrigger
                        value="printers"
                        className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2"
                    >
                        <Printer className="w-4 h-4" />
                        Impresoras
                    </TabsTrigger>
                    <TabsTrigger
                        value="toners"
                        className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2"
                    >
                        <Package className="w-4 h-4" />
                        Inventario Toners
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="flex-1 text-sm data-[state=active]:bg-[var(--color-bg-primary)] data-[state=active]:text-[var(--color-text-primary)] flex items-center gap-2"
                    >
                        <History className="w-4 h-4" />
                        Historial
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="printers" className="mt-0">
                    <Card className="p-6 bg-[var(--color-bg-secondary)] border-[var(--color-border)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="relative flex-1 sm:flex-none w-full sm:w-64 h-8">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Buscar por marca, modelo..."
                                    value={printerSearch}
                                    onChange={(e) => setPrinterSearch(e.target.value)}
                                    className="w-full h-full pl-8 pr-8 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                />
                                {printerSearch && (
                                    <button onClick={() => setPrinterSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <CustomDropdown
                                    value={printerSegment}
                                    onChange={setPrinterSegment}
                                    options={SEGMENT_OPTIONS}
                                    placeholder="Segmento"
                                    className="min-w-[150px]"
                                    buttonClassName="h-8 text-xs"
                                />
                                <CustomDropdown
                                    value={printerOwnership}
                                    onChange={setPrinterOwnership}
                                    options={OWNERSHIP_OPTIONS}
                                    placeholder="Propiedad"
                                    className="min-w-[150px]"
                                    buttonClassName="h-8 text-xs"
                                />
                                <Button variant="register" icon={Plus} onClick={openAddPrinter} className="h-8 px-3 !text-xs font-semibold whitespace-nowrap">
                                    Nueva Impresora
                                </Button>
                            </div>
                        </div>

                        {filteredPrinters.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[var(--color-border)] rounded-lg">
                                <Printer className="w-12 h-12 text-[var(--color-text-muted)] mb-3 opacity-50" />
                                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">No se encontraron impresoras</h3>
                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">Registra una impresora o ajusta los filtros.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                                            <th className="py-3 px-4">Segmento</th>
                                            <th className="py-3 px-4">Marca / Modelo</th>
                                            <th className="py-3 px-4">S/N</th>
                                            <th className="py-3 px-4">Ubicación</th>
                                            <th className="py-3 px-4">Tipo/IP</th>
                                            <th className="py-3 px-4">Propiedad</th>
                                            <th className="py-3 px-4">Escáner</th>
                                            <th className="py-3 px-4">Estado</th>
                                            <th className="py-3 px-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {filteredPrinters.map((p) => (
                                            <tr key={p.id} className="hover:bg-[var(--color-bg-primary)]/50 transition-colors">
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                                                        p.segment === 'hotel' 
                                                            ? 'bg-blue-500/10 text-blue-500' 
                                                            : 'bg-purple-500/10 text-purple-500'
                                                    }`}>
                                                        {p.segment}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-medium text-[var(--color-text-primary)]">
                                                    {p.brand} {p.model}
                                                </td>
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)] font-mono text-xs">
                                                    {p.serial_number || 'N/A'}
                                                </td>
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                                                    {p.location || 'N/A'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {p.connection_type === 'red' ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <Network className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                                            {p.ip_address ? (
                                                                <a 
                                                                    href={`http://${p.ip_address}`} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-[var(--color-primary)] hover:underline flex items-center gap-0.5"
                                                                >
                                                                    {p.ip_address}
                                                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                                                </a>
                                                            ) : (
                                                                <span className="text-red-500 text-xs">IP Faltante</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] text-xs">
                                                            <Laptop className="w-3.5 h-3.5" />
                                                            Local (USB)
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)] capitalize">
                                                    {p.ownership}
                                                </td>
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                                                    {p.has_scanner ? (
                                                        <span className="text-green-500 text-xs font-medium">Sí</span>
                                                    ) : (
                                                        <span className="text-[var(--color-text-muted)] text-xs">No</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        p.status === 'operational' 
                                                            ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                                            : p.status === 'maintenance' 
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
                                                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {p.status === 'operational' && <CheckCircle className="w-3 h-3" />}
                                                        {p.status === 'maintenance' && <AlertTriangle className="w-3 h-3" />}
                                                        {p.status === 'out_of_service' && <Ban className="w-3 h-3" />}
                                                        {p.status === 'operational' ? 'Operativa' : p.status === 'maintenance' ? 'Mantenimiento' : 'Fuera de Serv.'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 w-8 !p-0" 
                                                            onClick={() => openEditPrinter(p)}
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 w-8 !p-0 hover:bg-red-500/10 hover:border-red-500/20" 
                                                            onClick={() => setPrinterToDelete(p)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="toners" className="mt-0">
                    <Card className="p-6 bg-[var(--color-bg-secondary)] border-[var(--color-border)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="relative flex-1 sm:flex-none w-full sm:w-64 h-8">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Buscar modelo, color..."
                                    value={tonerSearch}
                                    onChange={(e) => setTonerSearch(e.target.value)}
                                    className="w-full h-full pl-8 pr-8 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                />
                                {tonerSearch && (
                                    <button onClick={() => setTonerSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => openTransaction('in')}
                                    className="h-8 text-xs"
                                >
                                    <ArrowUpRight className="w-3.5 h-3.5 text-green-500 mr-1.5" />
                                    Ingreso Stock
                                </Button>
                                <Button 
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => openTransaction('out')}
                                    className="h-8 text-xs"
                                >
                                    <ArrowDownLeft className="w-3.5 h-3.5 text-red-500 mr-1.5" />
                                    Despachar
                                </Button>
                                <Button variant="register" icon={Plus} onClick={openAddToner} className="h-8 px-3 !text-xs font-semibold whitespace-nowrap">
                                    Nuevo Modelo
                                </Button>
                            </div>
                        </div>

                        {filteredToners.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[var(--color-border)] rounded-lg">
                                <Package className="w-12 h-12 text-[var(--color-text-muted)] mb-3 opacity-50" />
                                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">No se encontraron modelos de toner</h3>
                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">Registra un modelo de toner en el catálogo.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                                            <th className="py-3 px-4">Modelo</th>
                                            <th className="py-3 px-4">Color</th>
                                            <th className="py-3 px-4">Impresoras Compatibles</th>
                                            <th className="py-3 px-4 text-center">Stock Hotel</th>
                                            <th className="py-3 px-4 text-center">Stock Corpo</th>
                                            <th className="py-3 px-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {filteredToners.map((t) => (
                                            <tr key={t.id} className="hover:bg-[var(--color-bg-primary)]/50 transition-colors">
                                                <td className="py-3 px-4 font-bold text-[var(--color-text-primary)]">
                                                    {t.model_name}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="flex items-center gap-2 text-[var(--color-text-primary)]">
                                                        <span className="w-3.5 h-3.5 rounded-full border border-[var(--color-border)]" style={{
                                                            backgroundColor: 
                                                                t.color.toLowerCase() === 'negro' ? '#111827' :
                                                                t.color.toLowerCase() === 'cian' || t.color.toLowerCase() === 'cyan' ? '#06b6d4' :
                                                                t.color.toLowerCase() === 'magenta' ? '#ec4899' :
                                                                t.color.toLowerCase() === 'amarillo' ? '#eab308' : '#cbd5e1'
                                                        }} />
                                                        {t.color}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)] max-w-xs truncate" title={t.compatible_printers}>
                                                    {t.compatible_printers || 'N/A'}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-bold ${
                                                        t.stock_hotel === 0 
                                                            ? 'bg-red-500/10 text-red-500' 
                                                            : t.stock_hotel <= 2 
                                                                ? 'bg-amber-500/10 text-amber-500' 
                                                                : 'bg-green-500/10 text-green-500'
                                                    }`}>
                                                        {t.stock_hotel}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-bold ${
                                                        t.stock_corpo === 0 
                                                            ? 'bg-red-500/10 text-red-500' 
                                                            : t.stock_corpo <= 2 
                                                                ? 'bg-amber-500/10 text-amber-500' 
                                                                : 'bg-green-500/10 text-green-500'
                                                    }`}>
                                                        {t.stock_corpo}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-xs border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
                                                            onClick={() => openTransaction('in', t.id)}
                                                        >
                                                            + Entrada
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-2 text-xs border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                                                            onClick={() => openTransaction('out', t.id)}
                                                        >
                                                            - Despacho
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 w-8 !p-0" 
                                                            onClick={() => openEditToner(t)}
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 w-8 !p-0 hover:bg-red-500/10 hover:border-red-500/20" 
                                                            onClick={() => setTonerToDelete(t)}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-0">
                    <Card className="p-6 bg-[var(--color-bg-secondary)] border-[var(--color-border)]">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div className="relative flex-1 sm:flex-none w-full sm:w-64 h-8">
                                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Buscar por toner, notas, usuario..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    className="w-full h-full pl-8 pr-8 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none transition-colors"
                                />
                                {historySearch && (
                                    <button onClick={() => setHistorySearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <CustomDropdown
                                    value={historySegment}
                                    onChange={setHistorySegment}
                                    options={SEGMENT_OPTIONS}
                                    placeholder="Segmento"
                                    className="min-w-[150px]"
                                    buttonClassName="h-8 text-xs"
                                />
                                <CustomDropdown
                                    value={historyType}
                                    onChange={setHistoryType}
                                    options={HISTORY_TYPE_OPTIONS}
                                    placeholder="Movimiento"
                                    className="min-w-[160px]"
                                    buttonClassName="h-8 text-xs"
                                />
                                <Button variant="ghost" onClick={fetchData} icon={RefreshCw} className="h-8 w-8 !p-0 text-[var(--color-primary)] hover:text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/10 shrink-0" />
                            </div>
                        </div>

                        {filteredTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 border border-dashed border-[var(--color-border)] rounded-lg">
                                <History className="w-12 h-12 text-[var(--color-text-muted)] mb-3 opacity-50" />
                                <h3 className="text-base font-semibold text-[var(--color-text-primary)]">No hay transacciones registradas</h3>
                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">Registra ingresos o despachos de stock en la pestaña Inventario.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] font-medium">
                                            <th className="py-3 px-4">Fecha / Hora</th>
                                            <th className="py-3 px-4">Toner</th>
                                            <th className="py-3 px-4">Color</th>
                                            <th className="py-3 px-4">Movimiento</th>
                                            <th className="py-3 px-4 text-center">Cantidad</th>
                                            <th className="py-3 px-4">Segmento</th>
                                            <th className="py-3 px-4">Impresora Destino</th>
                                            <th className="py-3 px-4">Notas</th>
                                            <th className="py-3 px-4">Usuario</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--color-border)]">
                                        {filteredTransactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-[var(--color-bg-primary)]/50 transition-colors">
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                                                    {formatDateTime(t.created_at)}
                                                </td>
                                                <td className="py-3 px-4 font-bold text-[var(--color-text-primary)]">
                                                    {t.model_name}
                                                </td>
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                                                    {t.color}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        t.type === 'in'
                                                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {t.type === 'in' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                                        {t.type === 'in' ? 'Ingreso' : 'Despacho'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center font-semibold text-[var(--color-text-primary)]">
                                                    {t.quantity}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                                                        t.segment === 'hotel' 
                                                            ? 'bg-blue-500/10 text-blue-500' 
                                                            : 'bg-purple-500/10 text-purple-500'
                                                    }`}>
                                                        {t.segment}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)] font-medium">
                                                    {t.printer_name || <span className="text-[var(--color-text-muted)] font-normal italic">N/A</span>}
                                                </td>
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)] max-w-xs truncate" title={t.notes}>
                                                    {t.notes || <span className="text-[var(--color-text-muted)] italic">Sin notas</span>}
                                                </td>
                                                <td className="py-3 px-4 text-[var(--color-text-secondary)]">
                                                    {t.user_name || 'Desconocido'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>

            <Modal
                isOpen={showPrinterModal}
                onClose={() => setShowPrinterModal(false)}
                title={editingPrinter ? 'Editar Impresora' : 'Registrar Nueva Impresora'}
                icon={Printer}
                size="md"
                footer={
                    <div className="flex gap-3 w-full">
                        <button type="button" onClick={() => setShowPrinterModal(false)} className="flex-1 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" form="printer-form" className="flex-1 py-2 text-sm rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            {editingPrinter ? 'Actualizar' : 'Registrar'}
                        </button>
                    </div>
                }
            >
                <form id="printer-form" onSubmit={handleSavePrinter} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Segmento</label>
                            <select
                                value={printerForm.segment}
                                onChange={(e) => setPrinterForm(prev => ({ ...prev, segment: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                <option value="hotel">Hotel</option>
                                <option value="corpo">Corporación (Corpo)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Propiedad</label>
                            <select
                                value={printerForm.ownership}
                                onChange={(e) => setPrinterForm(prev => ({ ...prev, ownership: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                <option value="propia">Propia</option>
                                <option value="alquilada">Alquilada</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Marca *</label>
                            <input
                                type="text"
                                placeholder="Ej: HP, Epson"
                                required
                                value={printerForm.brand}
                                onChange={(e) => setPrinterForm(prev => ({ ...prev, brand: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Modelo *</label>
                            <input
                                type="text"
                                placeholder="Ej: LaserJet M102w"
                                required
                                value={printerForm.model}
                                onChange={(e) => setPrinterForm(prev => ({ ...prev, model: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Número de Serie</label>
                        <input
                            type="text"
                            placeholder="Ingrese número de serie (S/N)"
                            value={printerForm.serial_number}
                            onChange={(e) => setPrinterForm(prev => ({ ...prev, serial_number: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Tipo de Conexión</label>
                            <select
                                value={printerForm.connection_type}
                                onChange={(e) => setPrinterForm(prev => ({ ...prev, connection_type: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                <option value="usb">USB Local</option>
                                <option value="red">Red (IP)</option>
                            </select>
                        </div>
                        {printerForm.connection_type === 'red' && (
                            <div>
                                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Dirección IP</label>
                                <input
                                    type="text"
                                    placeholder="Ej: 192.168.10.50"
                                    value={printerForm.ip_address}
                                    onChange={(e) => setPrinterForm(prev => ({ ...prev, ip_address: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none font-mono"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2.5 py-1">
                        <input
                            type="checkbox"
                            id="has_scanner"
                            checked={printerForm.has_scanner}
                            onChange={(e) => setPrinterForm(prev => ({ ...prev, has_scanner: e.target.checked }))}
                            className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                        />
                        <label htmlFor="has_scanner" className="text-xs font-medium text-[var(--color-text-secondary)] cursor-pointer select-none">
                            Tiene escáner integrado
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Ubicación</label>
                            <input
                                type="text"
                                placeholder="Ej: Recepción, Oficina"
                                value={printerForm.location}
                                onChange={(e) => setPrinterForm(prev => ({ ...prev, location: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Estado</label>
                            <select
                                value={printerForm.status}
                                onChange={(e) => setPrinterForm(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                <option value="operational">Operativa</option>
                                <option value="maintenance">Mantenimiento</option>
                                <option value="out_of_service">Fuera de Servicio</option>
                            </select>
                        </div>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showTonerModal}
                onClose={() => setShowTonerModal(false)}
                title={editingToner ? 'Editar Modelo de Toner' : 'Nuevo Modelo de Toner'}
                icon={Package}
                size="md"
                footer={
                    <div className="flex gap-3 w-full">
                        <button type="button" onClick={() => setShowTonerModal(false)} className="flex-1 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" form="toner-form" className="flex-1 py-2 text-sm rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)] text-white font-medium transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" />
                            {editingToner ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                }
            >
                <form id="toner-form" onSubmit={handleSaveToner} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Modelo *</label>
                            <input
                                type="text"
                                placeholder="Ej: 85A, 105A"
                                required
                                value={tonerForm.model_name}
                                onChange={(e) => setTonerForm(prev => ({ ...prev, model_name: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none font-bold"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Color *</label>
                            <select
                                value={tonerForm.color}
                                onChange={(e) => setTonerForm(prev => ({ ...prev, color: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                <option value="Negro">Negro</option>
                                <option value="Cian">Cian</option>
                                <option value="Magenta">Magenta</option>
                                <option value="Amarillo">Amarillo</option>
                                <option value="Multicolor">Multicolor</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Impresoras Compatibles</label>
                        <textarea
                            placeholder="Ej: HP LaserJet Pro P1102, P1102w..."
                            rows="3"
                            value={tonerForm.compatible_printers}
                            onChange={(e) => setTonerForm(prev => ({ ...prev, compatible_printers: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
                        />
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={showTransactionModal}
                onClose={() => setShowTransactionModal(false)}
                title={transactionMode === 'in' ? 'Registrar Ingreso de Stock' : 'Despachar Toner de Stock'}
                icon={transactionMode === 'in' ? ArrowUpRight : ArrowDownLeft}
                size="md"
                footer={
                    <div className="flex gap-3 w-full">
                        <button type="button" onClick={() => setShowTransactionModal(false)} className="flex-1 py-2 text-sm rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="transaction-form"
                            className={`flex-1 py-2 text-sm rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2 ${transactionMode === 'in' ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-light)]' : 'bg-[var(--color-danger)] hover:opacity-90'}`}
                        >
                            {transactionMode === 'in' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                            {transactionMode === 'in' ? 'Registrar Ingreso' : 'Confirmar Despacho'}
                        </button>
                    </div>
                }
            >
                <form id="transaction-form" onSubmit={handleSaveTransaction} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Modelo de Toner *</label>
                        <select
                            value={transactionForm.toner_model_id}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, toner_model_id: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none font-bold"
                        >
                            <option value="" disabled>Selecciona un toner...</option>
                            {toners.map(t => (
                                <option key={t.id} value={t.id}>
                                    {t.model_name} ({t.color}) - Stock: H:{t.stock_hotel} / C:{t.stock_corpo}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Segmento *</label>
                            <select
                                value={transactionForm.segment}
                                onChange={(e) => setTransactionForm(prev => ({ ...prev, segment: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                <option value="hotel">Hotel</option>
                                <option value="corpo">Corporación (Corpo)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Cantidad *</label>
                            <input
                                type="number"
                                min="1"
                                required
                                value={transactionForm.quantity}
                                onChange={(e) => setTransactionForm(prev => ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                            />
                        </div>
                    </div>

                    {transactionMode === 'out' && (
                        <div>
                            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 flex items-center gap-1">
                                Impresora de Destino
                                <span className="text-[var(--color-text-muted)] font-normal text-[10px]">(Filtradas por segmento)</span>
                            </label>
                            <select
                                value={transactionForm.printer_id}
                                onChange={(e) => setTransactionForm(prev => ({ ...prev, printer_id: e.target.value }))}
                                className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
                            >
                                <option value="">Selecciona impresora (Opcional)...</option>
                                {transactionCompatiblePrinters.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.brand} {p.model} ({p.location || 'Sin Ubicación'}) - S/N: {p.serial_number || 'N/A'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Notas</label>
                        <textarea
                            placeholder="Agrega notas sobre esta transacción..."
                            rows="2"
                            value={transactionForm.notes}
                            onChange={(e) => setTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none resize-none"
                        />
                    </div>
                </form>
            </Modal>

            <Dialog open={!!printerToDelete} onOpenChange={(open) => !open && setPrinterToDelete(null)}>
                <DialogContent className="bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            Eliminar Registro de Impresora
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        ¿Estás seguro de eliminar esta impresora? Esta acción no se puede deshacer y desvinculará los consumos de toner del historial.
                    </p>
                    {printerToDelete && (
                        <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg border border-[var(--color-border)] flex flex-col gap-1 text-sm font-medium">
                            <p className="text-[var(--color-text-primary)]">{printerToDelete.brand} {printerToDelete.model}</p>
                            <p className="text-[var(--color-text-secondary)] text-xs font-mono">S/N: {printerToDelete.serial_number || 'N/A'}</p>
                            <p className="text-[var(--color-text-muted)] text-xs uppercase">Segmento: {printerToDelete.segment} | Ubicación: {printerToDelete.location || 'N/A'}</p>
                        </div>
                    )}
                    <DialogFooter className="mt-2 gap-2">
                        <Button variant="outline" onClick={() => setPrinterToDelete(null)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={handleDeletePrinter}>
                            Eliminar Registro
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!tonerToDelete} onOpenChange={(open) => !open && setTonerToDelete(null)}>
                <DialogContent className="bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            Eliminar Modelo de Toner
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                        ¿Estás seguro de eliminar el modelo <strong className="text-[var(--color-text-primary)]">{tonerToDelete?.model_name} ({tonerToDelete?.color})</strong>?
                        Se perderá todo el stock e inventario asociado.
                    </p>
                    <DialogFooter className="mt-2 gap-2">
                        <Button variant="outline" onClick={() => setTonerToDelete(null)}>
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={handleDeleteToner}>
                            Eliminar Modelo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageWrapper>
    );
}
