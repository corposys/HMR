export default function ReportTable({ columns, rows, empty = 'Sin datos para el período seleccionado.' }) {
    if (!rows || rows.length === 0) {
        return (
            <div className="text-center py-8 text-sm text-[var(--color-text-muted)]">
                {empty}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-[var(--color-border)]">
                        {columns.map((col, idx) => (
                            <th
                                key={idx}
                                className={`text-left py-2 px-3 font-semibold text-[var(--color-text-secondary)] ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                            >
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rIdx) => (
                        <tr
                            key={rIdx}
                            className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg-tertiary)]/30 transition-colors"
                        >
                            {columns.map((col, cIdx) => (
                                <td
                                    key={cIdx}
                                    className={`py-2 px-3 text-[var(--color-text-primary)] ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''} ${col.mono ? 'font-mono text-xs' : ''}`}
                                >
                                    {col.render
                                        ? col.render(row)
                                        : (row[col.key] ?? '—')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
