export function escapeCsv(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export function exportToCSV(rows, filename = 'reporte.csv', columns) {
    if (!rows || rows.length === 0) return false;
    const cols = columns || Object.keys(rows[0]).map((key) => ({ key, label: key }));
    const header = cols.map((c) => escapeCsv(c.label || c.key)).join(',');
    const body = rows
        .map((row) =>
            cols
                .map((c) => {
                    const value = typeof c.format === 'function' ? c.format(row[c.key]) : row[c.key];
                    return escapeCsv(value);
                })
                .join(',')
        )
        .join('\n');
    const csv = `\uFEFF${header}\n${body}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
}
