import React from 'react';
import { Monitor, Download, Loader2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatSignaturePhone } from '@utils/signatureTemplates';

const FONT_ROUNDED = '"Nunito", "Arial Rounded MT Bold", Arial, sans-serif';
const FONT_EMAIL = '"Arimo", Arial, sans-serif';
const FONT_ADDRESS = '"Source Sans 3", "Myriad Pro", Arial, sans-serif';

export default function SignaturePreview({
    formData,
    template,
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
    const colors = template.colors;
    const mobileFormatted = formatSignaturePhone(formData.mobilePhone);

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
                        <table cellPadding="0" cellSpacing="0" border="0" style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif', width: '567px', height: '128px', maxHeight: '128px', backgroundColor: colors.panelBackground, tableLayout: 'fixed' }}>
                            <tbody>
                                <tr>
                                    <td width="200" style={{ width: '180px', backgroundColor: colors.logoBackground, padding: '0', textAlign: 'center', verticalAlign: 'middle', height: '128px' }}>
                                        <img
                                            src={template.logoPath}
                                            alt={template.logoAlt}
                                            width="170"
                                            style={{ display: 'block', margin: 'auto', maxWidth: '100%', height: 'auto' }}
                                        />
                                    </td>
                                    <td width="15" style={{ width: '5px' }}>&nbsp;</td>
                                    <td style={{ verticalAlign: 'middle', padding: '0 15px 0 10px', backgroundColor: colors.panelBackground, overflow: 'hidden' }}>
                                        <table cellPadding="0" cellSpacing="0" border="0" style={{ margin: 0, padding: 0, borderCollapse: 'collapse', width: '100%' }}>
                                            <tbody>
                                                <tr>
                                                    <td style={{ margin: 0, padding: '0', fontFamily: 'Arial', lineHeight: '1', whiteSpace: 'nowrap' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: formData.fullName ? colors.name : '#c0c0c0', textTransform: 'uppercase', lineHeight: '1', display: 'inline-block', verticalAlign: 'middle', fontFamily: FONT_ROUNDED }}>
                                                            {formData.fullName || placeholders.fullName}
                                                        </span>
                                                        <span style={{ color: colors.separator, fontWeight: '900', fontSize: '15px', margin: '0 8px', display: 'inline-block', verticalAlign: 'middle', transform: 'translateY(-2px)' }}>|</span>
                                                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: formData.jobTitle ? colors.jobTitle : '#c0c0c0', textTransform: 'uppercase', lineHeight: '1', display: 'inline-block', verticalAlign: 'middle', fontFamily: FONT_ROUNDED }}>
                                                            {formData.jobTitle || placeholders.jobTitle}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ margin: 0, padding: '6px 0 0 0', fontFamily: 'Arial', lineHeight: '0.5' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: formData.email ? colors.email : '#c0c0c0', textDecoration: 'none', lineHeight: '1', fontFamily: FONT_EMAIL }}>
                                                            {formData.email || placeholders.email}
                                                        </span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={{ margin: 0, padding: '8px 0 0 0', fontFamily: 'Arial', lineHeight: '1' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: colors.phone, lineHeight: '1', fontFamily: FONT_ROUNDED }}>
                                                            {`TELEF: ${template.officePhone}`}
                                                            {mobileFormatted ? (
                                                                <span>
                                                                    {' '}
                                                                    <span style={{ display: 'inline-block', transform: 'translateY(-1.5px)' }}>|</span>
                                                                    {` ${mobileFormatted}`}
                                                                </span>
                                                            ) : ''}
                                                            {' '}
                                                            <span style={formData.extension ? {} : previewPlaceholderStyle}>
                                                                {`Ext: ${formData.extension || placeholders.extension}`}
                                                            </span>
                                                        </span>
                                                    </td>
                                                </tr>
                                                {template.website && (
                                                    <tr>
                                                        <td style={{ margin: 0, padding: '0', fontFamily: 'Arial', lineHeight: '1' }}>
                                                            <a href={template.websiteUrl} style={{ fontSize: '11px', fontWeight: 'bold', color: colors.website, textDecoration: 'none', lineHeight: '1', fontFamily: FONT_ROUNDED }}>
                                                                {template.website}
                                                            </a>
                                                        </td>
                                                    </tr>
                                                )}
                                                <tr>
                                                    <td style={{ margin: 0, padding: '3px 0 0 0', fontFamily: 'Arial', lineHeight: '1' }}>
                                                        <span style={{ fontSize: '10px', color: colors.address, lineHeight: '1.1', display: 'block', fontFamily: FONT_ADDRESS }}>
                                                            {formData.address || placeholders.address}
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
