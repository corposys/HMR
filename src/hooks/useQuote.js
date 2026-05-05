import { useState, useCallback } from 'react';
import { apiJson } from '@utils/api';

const API_URL = '/api/rates/quote';

export function useQuote() {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchQuote = useCallback(async (params) => {
        setLoading(true);
        setError(null);
        setQuote(null);
        try {
            const query = new URLSearchParams(params).toString();
            const data = await apiJson(`${API_URL}?${query}`);
            setQuote(data.quote);
            return data.quote;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const resetQuote = useCallback(() => {
        setQuote(null);
        setError(null);
    }, []);

    return {
        quote,
        loading,
        error,
        fetchQuote,
        resetQuote,
    };
}
