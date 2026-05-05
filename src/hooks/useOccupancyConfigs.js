import { useState, useCallback } from 'react';
import { apiJson } from '@utils/api';

const API_URL = '/api/rates/occupancy-configs';

export function useOccupancyConfigs() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchConfigs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson(API_URL);
            setItems(data.items || []);
            return data.items || [];
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const createConfig = useCallback(async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson(API_URL, { method: 'POST', body: payload });
            setItems((prev) => [...prev, data.config]);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateConfig = useCallback(async (id, payload) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson(`${API_URL}/${id}`, { method: 'PUT', body: payload });
            setItems((prev) => prev.map((c) => (c.id === id ? { ...c, ...payload } : c)));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteConfig = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson(`${API_URL}/${id}`, { method: 'DELETE' });
            setItems((prev) => prev.filter((c) => c.id !== id));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        items,
        loading,
        error,
        fetchConfigs,
        createConfig,
        updateConfig,
        deleteConfig,
    };
}
