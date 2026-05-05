import { useState, useCallback } from 'react';
import { apiJson } from '@utils/api';

const API_URL = '/api/rates/rates';

export function useRates() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchRates = useCallback(async (params = {}) => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams(params).toString();
            const url = query ? `${API_URL}?${query}` : API_URL;
            const data = await apiJson(url);
            setItems(data.items || []);
            return data.items || [];
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const createRate = useCallback(async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson(API_URL, { method: 'POST', body: payload });
            setItems((prev) => [data.rate, ...prev]);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateRate = useCallback(async (id, payload) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson(`${API_URL}/${id}`, { method: 'PUT', body: payload });
            setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...payload } : r)));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const batchUpdate = useCallback(async (rates) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson(`${API_URL}/batch`, { method: 'POST', body: { rates } });
            await fetchRates();
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchRates]);

    const applyMultiplier = useCallback(async (seasonId, multiplier, roomTypeId = null) => {
        setLoading(true);
        setError(null);
        try {
            const body = { season_id: seasonId, multiplier };
            if (roomTypeId) body.room_type_id = roomTypeId;
            const data = await apiJson(`${API_URL}/apply-multiplier`, { method: 'POST', body });
            await fetchRates();
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchRates]);

    return {
        items,
        loading,
        error,
        fetchRates,
        createRate,
        updateRate,
        batchUpdate,
        applyMultiplier,
    };
}
