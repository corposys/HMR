import StatCard from '@shared/common/StatCard';

export default function KPIRow({ items = [], columns = 4, className = '' }) {
    const gridCols = {
        2: 'lg:grid-cols-2',
        3: 'lg:grid-cols-3',
        4: 'lg:grid-cols-4',
        5: 'lg:grid-cols-5',
        6: 'lg:grid-cols-6',
    };

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridCols[columns] || gridCols[4]} gap-4 ${className}`}>
            {items.map((item, index) => (
                <StatCard key={index} {...item} />
            ))}
        </div>
    );
}
