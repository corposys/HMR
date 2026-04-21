import React from 'react';
import { Monitor, Download, Loader2 } from 'lucide-react';

export default function SignaturePreview({ 
    formData, 
    fixedData, 
    placeholders, 
    isFormValid, 
    isDownloading, 
    handleDownload,
    signatureRef 
}) {
    const previewPlaceholderStyle = { color: '#c0c0c0' };

    return (
        <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)] shadow-sm p-6">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                    <Monitor className="w-7 h-7 text-[var(--color-primary)]" />
                    Vista Previa
                </h2>
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

            {/* Contenedor de la vista previa real */}
            <div className="bg-[var(--color-bg-primary)] rounded-lg p-6 border border-[var(--color-border)] overflow-x-auto flex justify-center items-center">

                {/* Contenedor específico de la firma */}
                <div ref={signatureRef} data-signature style={{ width: '567px', height: '128px', overflow: 'hidden' }}>
                    <table cellPadding="0" cellSpacing="0" border="0" style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif', width: '567px', height: '128px', maxHeight: '128px', backgroundColor: '#ffffff', tableLayout: 'fixed' }}>
                        <tbody>
                            <tr>
                                {/* COLUMNA LOGO */}
                                <td width="200" style={{ width: '180px', backgroundColor: 'var(--color-primary)', padding: '0', textAlign: 'center', verticalAlign: 'middle', height: '128px' }}>
                                    <img
                                        src="/img/logo-hmr-main-white-.png"
                                        alt="Hotel Margarita Real"
                                        width="170"
                                        style={{ display: 'block', margin: 'auto', maxWidth: '100%', height: 'auto' }}
                                    />
                                </td>

                                {/* ESPACIADOR VERTICAL */}
                                <td width="15" style={{ width: '5px' }}>&nbsp;</td>

                                {/* COLUMNA DATOS PERSONALES */}
                                <td style={{ verticalAlign: 'top', padding: '15px 0 0 10px', backgroundColor: '#ffffff', overflow: 'hidden' }}>
                                    {/* Nombre y Cargo */}
                                    <table cellPadding="0" cellSpacing="0" border="0" style={{ margin: 0, padding: 0, borderCollapse: 'collapse' }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ margin: 0, padding: '0 0 2px 0', fontFamily: 'Arial', lineHeight: '1' }}>
                                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: formData.fullName ? '#009098' : '#c0c0c0', textTransform: 'uppercase', lineHeight: '1', display: 'inline-block', verticalAlign: 'middle' }}>
                                                        {formData.fullName || placeholders.fullName}
                                                    </span>
                                                    <span style={{ color: '#009098', fontWeight: 'bold', fontSize: '14px', margin: '0 6px', display: 'inline-block', verticalAlign: 'middle', transform: 'translateY(-2px)' }}>|</span>
                                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: formData.jobTitle ? '#555555' : '#c0c0c0', textTransform: 'uppercase', lineHeight: '1', display: 'inline-block', verticalAlign: 'middle' }}>
                                                        {formData.jobTitle || placeholders.jobTitle}
                                                    </span>
                                                </td>
                                            </tr>
                                            {/* Correo Electrónico */}
                                            <tr>
                                                <td style={{ margin: 0, padding: '2px 0', fontFamily: 'Arial', lineHeight: '0.5' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: formData.email ? '#555555' : '#c0c0c0', textDecoration: 'none', lineHeight: '1' }}>
                                                        {formData.email || placeholders.email}
                                                    </span>
                                                </td>
                                            </tr>
                                            {/* Telefonos */}
                                            <tr>
                                                <td style={{ margin: 0, padding: '0', fontFamily: 'Arial', lineHeight: '1' }}>
                                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#009098', lineHeight: '1' }}>
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
                                            {/* Web */}
                                            <tr>
                                                <td style={{ margin: 0, padding: '2px 0', fontFamily: 'Arial', lineHeight: '1' }}>
                                                    <a href={`https://${fixedData.website}`} style={{ fontSize: '11px', fontWeight: 'bold', color: '#009098', textDecoration: 'none', lineHeight: '1' }}>
                                                        {fixedData.website}
                                                    </a>
                                                </td>
                                            </tr>
                                            {/* Direccion */}
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
        </div>
    );
}
