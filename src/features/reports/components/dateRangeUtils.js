export const PRESETS = [
    { id: 'today', label: 'Hoy', days: 1 },
    { id: '7d', label: '7 días', days: 7 },
    { id: '30d', label: '30 días', days: 30 },
    { id: '90d', label: '90 días', days: 90 },
];

function formatDateInput(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function buildRangeFromPreset(presetId) {
    const today = new Date();
    const to = formatDateInput(today);
    const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[2];
    const from = new Date(today);
    from.setDate(from.getDate() - preset.days + 1);
    return { from: formatDateInput(from), to };
}
