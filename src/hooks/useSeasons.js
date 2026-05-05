import { useState, useCallback } from 'react';
import { apiJson } from '@utils/api';

const API_URL = '/api/rates/seasons';

export function useSeasons() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSeasons = useCallback(async (params = {}) => {
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

    const createSeason = useCallback(async (payload) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson(API_URL, { method: 'POST', body: payload });
            setItems((prev) => [data.season, ...prev]);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateSeason = useCallback(async (id, payload) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson(`${API_URL}/${id}`, { method: 'PUT', body: payload });
            setItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...payload } : s)));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteSeason = useCallback(async (id) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson(`${API_URL}/${id}`, { method: 'DELETE' });
            setItems((prev) => prev.filter((s) => s.id !== id));
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const cloneSeason = useCallback(async (id, targetYear) => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiJson(`${API_URL}/${id}/clone?target_year=${targetYear}`, { method: 'POST' });
            await fetchSeasons();
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [fetchSeasons]);

    return {
        items,
        loading,
        error,
        fetchSeasons,
        createSeason,
        updateSeason,
        deleteSeason,
        cloneSeason,
    };
}
