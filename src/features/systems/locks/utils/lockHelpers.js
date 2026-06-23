export const formatShortDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });
};

export const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('es-VE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export const getUrgencyScore = (lock, prediction) => {
    if (lock.status === 'out_of_service') return -250;
    if (lock.status === 'needs_review') return -150;
    if (!prediction) return 0;
    return prediction.days_remaining <= 0 ? prediction.days_remaining : Math.min(prediction.days_remaining, 100);
};

export const getRackPriorityScore = (item) => {
    const statusRank = {
        out_of_service: 0,
        needs_review: 1,
        operational: 2,
    };

    const prediction = item.prediction;
    const base = statusRank[item.status] ?? 2;
    const predictionRank = prediction
        ? (prediction.days_remaining <= 0 ? -2 : prediction.days_remaining <= 15 ? -1 : 0)
        : 0;

    return base * 100 + predictionRank;
};

export const formatFloorCode = (floorCode) => {
    if (!floorCode) return 'Sin piso';
    return String(floorCode).toUpperCase();
};
