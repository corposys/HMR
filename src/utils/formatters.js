export function formatDate(date, options = {}) {
    if (!date) return 'N/A';

    const d = typeof date === 'string' ? new Date(date) : date;

    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
    };

    return d.toLocaleDateString('es-VE', defaultOptions);
}