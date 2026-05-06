export const LOCK_STATUS_STYLES = {
    operational: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
    preventive: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
    failure: 'border-red-500/25 bg-red-500/10 text-red-400',
    out_of_service: 'border-zinc-500/25 bg-zinc-500/10 text-zinc-300',
};

export const LOCK_STATUS_LABELS = {
    operational: 'Operativa',
    preventive: 'Preventiva',
    failure: 'Falla',
    out_of_service: 'Fuera de servicio',
};

export const LOCK_STATUS_DOT_STYLES = {
    operational: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]',
    preventive: 'bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.45)]',
    failure: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.45)]',
    out_of_service: 'bg-zinc-400 shadow-[0_0_10px_rgba(161,161,170,0.35)]',
};

export const RACK_VIEW_MODES = {
    structure: 'structure',
    module: 'module',
    priority: 'priority',
};

export const RACK_VIEW_LABELS = {
    structure: 'Estructura hotelera',
    module: 'Apilado por módulo',
    priority: 'Prioridad operativa',
};
