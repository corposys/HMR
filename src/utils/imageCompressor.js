const MAX_UPLOAD_MB = 2;

export function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('El archivo debe ser una imagen'));
            return;
        }

        const maxBytes = MAX_UPLOAD_MB * 1024 * 1024;
        if (file.size > maxBytes * 1.5) {
            reject(new Error(`La imagen excede el tamaño máximo de ${MAX_UPLOAD_MB}MB`));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let { width, height } = img;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const outputQuality = outputType === 'image/jpeg' ? quality : undefined;

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Error al comprimir la imagen'));
                            return;
                        }

                        if (blob.size > maxBytes) {
                            const lowerQuality = outputType === 'image/jpeg' ? quality * 0.6 : quality;
                            canvas.toBlob(
                                (retryBlob) => {
                                    if (!retryBlob || retryBlob.size > maxBytes) {
                                        reject(new Error(`La imagen comprimida aún excede ${MAX_UPLOAD_MB}MB. Usa una imagen más pequeña.`));
                                        return;
                                    }
                                    resolve(retryBlob);
                                },
                                outputType,
                                lowerQuality,
                            );
                            return;
                        }

                        resolve(blob);
                    },
                    outputType,
                    outputQuality,
                );
            };
            img.onerror = () => reject(new Error('Error al cargar la imagen'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsDataURL(file);
    });
}

export async function uploadPaymentScreenshot(file) {
    let compressed = file;

    if (file.type.startsWith('image/')) {
        try {
            compressed = await compressImage(file);
        } catch {
            // use original if compression fails
            compressed = file;
        }
    }

    const formData = new FormData();
    formData.append('file', compressed, file.name);

    const token = localStorage.getItem('token');
    const response = await fetch('/api/reception/upload', {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || 'Error al subir archivo');
    }

    return response.json();
}