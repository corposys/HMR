import { useState, useCallback } from 'react';
import { apiFetch } from '@utils/api';

export function useLockDashboard() {
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [aData, sData, pData] = await Promise.all([
                apiFetch('/api/maintenance/alerts?threshold=15'),
                apiFetch('/api/maintenance/stats'),
                apiFetch('/api/maintenance/predictions'),
            ]);
            setAlerts(aData.alerts || []);
            setStats(sData.stats || null);
            setPredictions(pData.predictions || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        alerts,
        stats,
        predictions,
        loading,
        fetchDashboardData
    };
}

export function useLocksOverview() {
    const [locks, setLocks] = useState([]);
    const [predictionsByRoom, setPredictionsByRoom] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLocksOverview = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        setError(null);
        try {
            const [locksData, predictionsData] = await Promise.all([
                apiFetch('/api/maintenance/locks'),
                apiFetch('/api/maintenance/predictions'),
            ]);

            const byRoom = Object.fromEntries(
                (predictionsData.predictions || []).map((item) => [item.room_id, item])
            );

            setLocks(locksData.locks || []);
            setPredictionsByRoom(byRoom);
        } catch (err) {
            setError(err.message || 'Error cargando cerraduras');
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    return {
        locks,
        predictionsByRoom,
        loading,
        error,
        fetchLocksOverview,
    };
}