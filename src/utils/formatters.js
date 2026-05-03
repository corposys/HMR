/**
 * Date formatting utilities
 * Centralized here to avoid duplication across the codebase
 */

/**
 * Format a date to Spanish locale string
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
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

/**
 * Format a date with time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date) {
    if (!date) return 'N/A';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    return d.toLocaleDateString('es-VE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format a short date (MM/DD/YYYY)
 * @param {string|Date} date - Date to format
 * @returns {string} Short date string
 */
export function formatShortDate(date) {
    if (!date) return 'N/A';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    return d.toLocaleDateString('es-VE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

/**
 * Format currency (Venezuelan Bolívar or USD)
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'USD') {
    if (amount === null || amount === undefined) return 'N/A';
    
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency,
    }).format(amount);
}
