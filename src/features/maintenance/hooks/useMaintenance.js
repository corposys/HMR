import { useState, useCallback } from 'react';

export function useMaintenanceLogs() {
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchLogs = useCallback(async (typeFilter = 'all') => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (typeFilter !== 'all') params.set('type', typeFilter);

            const [logsRes, statsRes] = await Promise.all([
                fetch(`/api/maintenance?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/maintenance/stats', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            
            if (!logsRes.ok || !statsRes.ok) throw new Error('Error al cargar datos');

            const logsData = await logsRes.json();
            const statsData = await statsRes.json();
            
            setLogs(logsData.logs || []);
            setStats(statsData.stats || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteLog = async (id) => {
        setDeleting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/maintenance/${id}`, {
                method: 'DELETE', 
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Error al eliminar');
            setLogs(prev => prev.filter(l => l.id !== id));
            return true;
        } catch (err) {
            console.error(err);
            return false;
        } finally {
            setDeleting(false);
        }
    };

    const createLog = async (data) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Error al guardar');
            return true;
        } catch (err) {
            console.error(err);
            return false;
        } finally {
            setSaving(false);
        }
    };

    return {
        logs,
        stats,
        loading,
        error,
        saving,
        deleting,
        fetchLogs,
        deleteLog,
        createLog
    };
}

export function useMaintenanceDashboard() {
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
