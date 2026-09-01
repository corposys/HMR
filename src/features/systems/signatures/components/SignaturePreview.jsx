import React from 'react';
import { Monitor, Download, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BRAND_TEAL = '#009098';

export default function SignaturePreview({
    formData,
    fixedData,
    placeholders,
    isFormValid,
    isDownloading,
    isSaving,
    handleDownload,
    handleSave,
    signatureRef,
    compact = false
}) {
    const previewPlaceholderStyle = { color: '#c0c0c0' };

    return (
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
            <CardHeader className="pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-medium text-[var(--color-text-primary)] flex items-center gap-2 m-0">
                    <Monitor className="w-7 h-7 text-[var(--color-primary)]" />
                    Vista Previa
                </CardTitle>
                <div className="flex items-center gap-2">
                    {handleSave && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isDownloading || !isFormValid}
                            title={!isFormValid ? "Completa los campos obligatorios" : "Guardar en historial sin descargar"}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isSaving || isDownloading || !isFormValid
                                ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]'
                                }`}
                        >
                            {isSaving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                            ) : (
                                <><Save className="w-4 h-4" /> Guardar</>
                            )}
                        </button>
                    )}
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading || !isFormValid}
                        title={!isFormValid ? "Completa los campos obligatorios para descargar" : ""}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDownloading || !isFormValid
                            ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                            : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-light)]'
                            }`}
                    >
                        {isDownloading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Descargando...</>
                        ) : (
                            <><Download className="w-4 h-4" /> Descargar</>
                        )}
                    </button>
                </div>
            </CardHeader>
            <CardContent>
                <div className={`bg-[var(--color-bg-primary)] rounded-lg p-4 border border-[var(--color-border)] overflow-x-auto flex justify-center items-center ${compact ? 'min-h-[160px]' : 'min-h-[200px]'}`}>
                    <div ref={signatureRef} data-signature style={{ width: '567px', height: '128px', overflow: 'hidden', minWidth: '567px' }}>
                        <table cellPadding="0" cellSpacing="0" border="0" style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif', width: '567px', height: '128px', maxHeight: '128px', backgroundColor: '#ffffff', tableLayout: 'fixed' }}>
                            <tbody>
                                <tr>
                                    <td width="200" style={{ width: '180px', backgroundColor: BRAND_TEAL, padding: '0', textAlign: 'center', verticalAlign: 'middle', height: '128px' }}>
                                        <img
                                            src="/img/logo-hmr-main-white-.png"
                                            alt="Hotel Margarita Real"
                                            width="170"
                                            style={{ display: 'block', margin: 'auto', maxWidth: '100%', height: 'auto' }}
                                        />
                                    </td>
                                    <td width="15" style={{ width: '5px' }}>&nbsp;</td>
                                    <td style={{ verticalAlign: 'top', padding: '15px 0 0 10px', backgroundColor: '#ffffff', overflow: 'hidden' }}>
                                        <table cellPadding="0" cellSpacing="0" border="0" style={{ margin: 0, padding: 0, borderCollapse: 'collapse' }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ margin: 0, padding: '0 0 2px 0', fontFamily: 'Arial', lineHeight: '1' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: formData.fullName ? BRAND_TEAL : '#c0c0c0', textTransform: 'uppercase', lineHeight: '1', display: 'inline-block', verticalAlign: 'middle' }}>
                                                            {formData.fullName || placeholders.fullName}
                                                        </span>
                                                        <span style={{ color: BRAND_TEAL, fontWeight: 'bold', fontSize: '14px', margin: '0 6px', display: 'inline-block', verticalAlign: 'middle', transform: 'translateY(-2px)' }}>|</span>
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: formData.jobTitle ? '#555555' : '#c0c0c0', textTransform: 'uppercase', lineHeight: '1', display: 'inline-block', verticalAlign: 'middle' }}>
                                                            {formData.jobTitle || placeholders.jobTitle}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ margin: 0, padding: '2px 0', fontFamily: 'Arial', lineHeight: '0.5' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: formData.email ? '#555555' : '#c0c0c0', textDecoration: 'none', lineHeight: '1' }}>
                                                            {formData.email || placeholders.email}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ margin: 0, padding: '0', fontFamily: 'Arial', lineHeight: '1' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: BRAND_TEAL, lineHeight: '1' }}>
                                                            {fixedData.officePhone}
                                                            {' '}
                                                            <span style={formData.extension ? {} : previewPlaceholderStyle}>
                                                                {`Ext: ${formData.extension || placeholders.extension}`}
                                                            </span>
                                                            {formData.mobilePhone ? (
                                                                <span>
                                                                    {` Teléf: ${formData.mobilePhone}`}
                                                                </span>
                                                            ) : (
                                                                <span className="export-hide" style={previewPlaceholderStyle}>
                                                                    {` Teléf: ${placeholders.mobilePhone}`}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ margin: 0, padding: '2px 0', fontFamily: 'Arial', lineHeight: '1' }}>
                                                        <a href={fixedData.websiteUrl} style={{ fontSize: '11px', fontWeight: 'bold', color: BRAND_TEAL, textDecoration: 'none', lineHeight: '1' }}>
                                                            {fixedData.website}
                                                        </a>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ margin: 0, padding: '2px 0 0 0', fontFamily: 'Arial', lineHeight: '1' }}>
                                                        <span style={{ fontSize: '10px', color: '#555555', lineHeight: '1.1', display: 'block' }}>
                                                            {fixedData.address.split('Hotel Margarita Real.')[0]}Hotel Margarita Real.<br />
                                                            {fixedData.address.split('Hotel Margarita Real. ')[1]}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
