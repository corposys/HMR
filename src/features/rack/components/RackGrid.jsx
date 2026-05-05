import RackModuleSection from './RackModuleSection';

export default function RackGrid({ groupedRooms, viewMode, onRoomClick }) {
    if (!groupedRooms.length) {
        return (
            <div className="flex items-center justify-center h-96 text-[var(--color-text-muted)]">
                <div className="text-center">
                    <p className="text-lg font-medium">No hay habitaciones que coincidan</p>
                    <p className="text-sm mt-1">Ajusta los filtros para ver resultados</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {groupedRooms.map(module => (
                <RackModuleSection
                    key={module.module_id}
                    module={module}
                    viewMode={viewMode}
                    onRoomClick={onRoomClick}
                />
            ))}
        </div>
    );
}
