import LoadingSpinner from '@shared/common/LoadingSpinner';
import ErrorState from '@shared/common/ErrorState';
import EmptyState from '@shared/common/EmptyState';

export default function ReportSection({ loading, error, data, children, emptyTitle = 'Sin datos' }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <LoadingSpinner />
            </div>
        );
    }
    if (error) {
        return <ErrorState message={error} />;
    }
    if (!data) {
        return <EmptyState title={emptyTitle} message="No hay información disponible para el período seleccionado." />;
    }
    return children;
}
