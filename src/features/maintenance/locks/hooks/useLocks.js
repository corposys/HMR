import { useState, useCallback } from 'react';

export function useLockDashboard() {
    const [alerts, setAlerts] = useState([]);
    const [stats, setStats] = useState(null);
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const [aRes, sRes, pRes] = await Promise.all([
                fetch('/api/maintenance/alerts?threshold=15', { headers }),
                fetch('/api/maintenance/stats', { headers }),
                fetch('/api/maintenance/predictions', { headers }),
            ]);
            const aData = await aRes.json();
            const sData = await sRes.json();
            const pData = await pRes.json();
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

    const fetchLocksOverview = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            const [locksRes, predictionsRes] = await Promise.all([
                fetch('/api/maintenance/locks', { headers }),
                fetch('/api/maintenance/predictions', { headers }),
            ]);

            if (!locksRes.ok || !predictionsRes.ok) {
                throw new Error('No se pudo cargar el control de cerraduras');
            }

            const locksData = await locksRes.json();
            const predictionsData = await predictionsRes.json();
            const byRoom = Object.fromEntries(
                (predictionsData.predictions || []).map((item) => [item.room_id, item])
            );

            setLocks(locksData.locks || []);
            setPredictionsByRoom(byRoom);
        } catch (err) {
            setError(err.message || 'Error cargando cerraduras');
        } finally {
            setLoading(false);
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
