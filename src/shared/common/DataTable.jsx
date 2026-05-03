import LoadingSpinner from './LoadingSpinner';

export default function DataTable({ columns, data, loading, emptyText, onRowClick, className = '' }) {
    if (loading) {
        return <LoadingSpinner />;
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center py-12 text-sm text-[var(--color-text-muted)]">
                {emptyText || 'No hay datos'}
            </div>
        );
    }

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className={col.headerClassName || ''}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr
                            key={row.id || i}
                            onClick={() => onRowClick?.(row)}
                            className={onRowClick ? 'cursor-pointer' : ''}
                        >
                            {columns.map((col) => (
                                <td key={col.key} className={col.cellClassName || ''}>
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}