import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Copy, Trash2, Edit, Calendar, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@shared/common/Button';
import Card from '@shared/common/Card';
import Modal from '@shared/common/Modal';
import Input from '@shared/common/Input';
import CustomDropdown from '@shared/common/CustomDropdown';
import { useSeasons } from '@hooks/useSeasons';
import { usePermissions } from '@hooks/usePermissions';

const SEASON_TYPE_OPTIONS = [
    { value: 'low', label: 'Baja' },
    { value: 'high', label: 'Alta' },
    { value: 'shoulder', label: 'Intermedia' },
    { value: 'special', label: 'Especial' },
];

const SEASON_TYPE_LABELS = {
    low: 'Baja',
    high: 'Alta',
    shoulder: 'Intermedia',
    special: 'Especial',
};

const SEASON_COLORS = {
    low: 'bg-[#2d6a4f] text-white hover:bg-[#2d6a4f]/80',
    high: 'bg-[#c75b39] text-white hover:bg-[#c75b39]/80',
    shoulder: 'bg-[#e29578] text-white hover:bg-[#e29578]/80',
    special: 'bg-[#6b4c9a] text-white hover:bg-[#6b4c9a]/80',
};

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function generateMonthGrid(year, month) {
    const startDay = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const grid = [];
    let currentWeek = new Array(startDay).fill(null);
    
    for (let i = 1; i <= numDays; i++) {
        currentWeek.push(i);
        if (currentWeek.length === 7) {
            grid.push(currentWeek);
            currentWeek = [];
        }
    }
    
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        grid.push(currentWeek);
    }
    
    return grid;
}

export default function SeasonManager() {
    const { items, fetchSeasons, createSeason, updateSeason, deleteSeason, cloneSeason } = useSeasons();
    const { can } = usePermissions();
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formError, setFormError] = useState(null);
    const [formType, setFormType] = useState('low');
    const [cloneYear, setCloneYear] = useState('');
    const [showCloneModal, setShowCloneModal] = useState(false);
    const [cloneTarget, setCloneTarget] = useState(null);
    
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchSeasons();
    }, [fetchSeasons]);

    const seasonsForYear = useMemo(() => {
        return items.filter(s => s.year === currentYear && s.is_active);
    }, [items, currentYear]);

    // Map each date to a season type
    const dateToSeasonMap = useMemo(() => {
        const map = new Map();
        seasonsForYear.forEach(season => {
            const start = new Date(season.start_date);
            const end = new Date(season.end_date);
            // Just iterate dates from start to end
            let current = new Date(start);
            while (current <= end) {
                const dateString = current.toISOString().split('T')[0];
                map.set(dateString, season.type);
                current.setDate(current.getDate() + 1);
            }
        });
        return map;
    }, [seasonsForYear]);

    const openModal = useCallback((row) => {
        setEditing(row);
        setFormType(row?.type || 'low');
        setFormError(null);
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditing(null);
        setFormError(null);
        setFormType('low');
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setFormError(null);
        const fd = new FormData(e.target);
        const payload = {
            name: fd.get('name'),
            type: formType,
            start_date: fd.get('start_date'),
            end_date: fd.get('end_date'),
            year: parseInt(fd.get('year')),
            is_active: fd.get('is_active') === 'on',
        };

        try {
            if (editing) {
                await updateSeason(editing.id, payload);
            } else {
                await createSeason(payload);
            }
            setShowModal(false);
            setEditing(null);
        } catch (err) {
            setFormError(err.message);
        }
    }, [editing, formType, createSeason, updateSeason]);

    const handleDelete = useCallback(async (id) => {
        if (!confirm('¿Eliminar esta temporada? Se eliminarán también sus tarifas.')) return;
        try {
            await deleteSeason(id);
        } catch (err) {
            alert(err.message);
        }
    }, [deleteSeason]);

    const handleClone = useCallback(async () => {
        if (!cloneYear || !cloneTarget) return;
        try {
            await cloneSeason(cloneTarget.id, parseInt(cloneYear));
            setShowCloneModal(false);
            setCloneTarget(null);
            setCloneYear('');
        } catch (err) {
            alert(err.message);
        }
    }, [cloneSeason, cloneYear, cloneTarget]);

    const getDayColor = (year, month, day) => {
        if (!day) return '';
        // Format to YYYY-MM-DD
        const m = String(month + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateString = `${year}-${m}-${d}`;
        const seasonType = dateToSeasonMap.get(dateString);
        
        if (seasonType && SEASON_COLORS[seasonType]) {
            return SEASON_COLORS[seasonType];
        }
        return 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)]';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Panel Principal: Calendario Anual */}
            <div className="lg:col-span-3 space-y-2">
                <div className="flex items-center justify-between bg-[var(--color-bg-secondary)] border border-[var(--color-border)] px-3 py-2 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentYear(y => y - 1)} className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded-md transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <h2 className="text-base font-bold text-[var(--color-text-primary)] w-12 text-center">{currentYear}</h2>
                        <button onClick={() => setCurrentYear(y => y + 1)} className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded-md transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-medium">
                        {Object.entries(SEASON_TYPE_LABELS).map(([key, label]) => (
                            <div key={key} className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-sm ${SEASON_COLORS[key].split(' ')[0]}`}></div>
                                <span className="text-[var(--color-text-secondary)]">{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                    {Array.from({ length: 12 }).map((_, monthIndex) => (
                        <div key={monthIndex} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-2 shadow-sm">
                            <h3 className="text-[8px] text-[var(--color-text-primary)] mb-0.5 text-center uppercase tracking-wider">{MONTHS[monthIndex]}</h3>
                            <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                                {DAYS.map((day, i) => (
                                    <div key={i} className="text-[12px] font-medium text-[var(--color-text-muted)] text-center">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-0.5">
                                {generateMonthGrid(currentYear, monthIndex).map((week, wIndex) => 
                                    week.map((day, dIndex) => (
                                        <div 
                                            key={`${wIndex}-${dIndex}`} 
                                            className={`
                                                h-5 flex items-center justify-center text-[9px] rounded-sm transition-colors cursor-default
                                                ${day ? getDayColor(currentYear, monthIndex, day) : 'invisible'}
                                            `}
                                            title={day ? `${day} de ${MONTHS[monthIndex]}` : ''}
                                        >
                                            {day}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Panel Lateral: Lista de Temporadas */}
            <div className="lg:col-span-1 space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Temporadas {currentYear}</h3>
                    {can('settings', 'write') && (
                        <Button variant="ghost" size="sm" icon={Plus} onClick={() => openModal(null)}>
                            Añadir
                        </Button>
                    )}
                </div>

                <div className="space-y-2">
                    {seasonsForYear.length === 0 ? (
                        <div className="text-center py-4 text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border)] rounded-lg">
                            No hay temporadas para {currentYear}
                        </div>
                    ) : (
                        seasonsForYear.map(season => (
                            <div key={season.id} className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-2 shadow-sm group">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${SEASON_COLORS[season.type].split(' ')[0]}`}></div>
                                        <h4 className="text-xs font-semibold text-[var(--color-text-primary)]">{season.name}</h4>
                                    </div>
                                    {can('settings', 'write') && (
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openModal(season)} className="p-1 hover:bg-[var(--color-bg-tertiary)] rounded text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
                                                <Edit className="w-3 h-3" />
                                            </button>
                                            <button onClick={() => handleDelete(season.id)} className="p-1 hover:bg-red-500/10 rounded text-[var(--color-text-secondary)] hover:text-red-400">
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-[10px] text-[var(--color-text-secondary)]">
                                    {season.start_date} → {season.end_date}
                                </div>
                                <div className="mt-1 flex items-center justify-between">
                                    <span className="text-[9px] uppercase font-medium tracking-wider text-[var(--color-text-muted)]">
                                        {SEASON_TYPE_LABELS[season.type]}
                                    </span>
                                    {can('settings', 'write') && (
                                        <button onClick={() => { setCloneTarget(season); setShowCloneModal(true); }} className="text-[9px] flex items-center gap-0.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                                            <Copy className="w-2.5 h-2.5" /> Clonar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={closeModal}
                    title={editing ? 'Editar Temporada' : 'Nueva Temporada'}
                    icon={Calendar}
                    footer={(
                        <>
                            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
                            <Button type="submit" form="season-form">{editing ? 'Guardar' : 'Crear'}</Button>
                        </>
                    )}
                >
                    <form id="season-form" onSubmit={handleSubmit} className="space-y-4">
                        {formError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-danger)]/10 text-[var(--color-danger)] text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                {formError}
                            </div>
                        )}
                        <Input
                            name="name"
                            label="Nombre"
                            defaultValue={editing?.name || ''}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">Tipo</label>
                            <CustomDropdown
                                value={formType}
                                onChange={setFormType}
                                options={SEASON_TYPE_OPTIONS}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                name="start_date"
                                label="Fecha inicio"
                                type="date"
                                defaultValue={editing?.start_date || ''}
                                required
                            />
                            <Input
                                name="end_date"
                                label="Fecha fin"
                                type="date"
                                defaultValue={editing?.end_date || ''}
                                required
                            />
                        </div>
                        <Input
                            name="year"
                            label="Año"
                            type="number"
                            defaultValue={editing?.year || currentYear}
                            required
                        />
                        <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                            <input
                                name="is_active"
                                type="checkbox"
                                defaultChecked={editing ? editing.is_active : true}
                                className="rounded border-[var(--color-border)]"
                            />
                            Activa
                        </label>
                    </form>
                </Modal>
            )}

            {showCloneModal && cloneTarget && (
                <Modal
                    isOpen={showCloneModal}
                    onClose={() => { setShowCloneModal(false); setCloneTarget(null); setCloneYear(''); }}
                    title={`Clonar: ${cloneTarget.name}`}
                    icon={Copy}
                    footer={(
                        <>
                            <Button variant="ghost" onClick={() => { setShowCloneModal(false); setCloneTarget(null); }}>Cancelar</Button>
                            <Button onClick={handleClone} disabled={!cloneYear}>Clonar</Button>
                        </>
                    )}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-[var(--color-text-secondary)]">
                            Se creará una copia de <strong>{cloneTarget.name}</strong> con sus tarifas para el año indicado.
                        </p>
                        <Input
                            label="Año destino"
                            type="number"
                            value={cloneYear}
                            onChange={(e) => setCloneYear(e.target.value)}
                            placeholder={new Date().getFullYear() + 1}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}
