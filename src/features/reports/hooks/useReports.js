import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@utils/api';

export function useReport(domain, range) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);
    const domainRef = useRef(domain);
    domainRef.current = domain;

    const fetch = useCallback(async () => {
        if (!mountedRef.current) return;
        setData(null);
        setError(null);
        setLoading(true);
        const capturedDomain = domain;
        try {
            let url;
            if (domain === 'overview') {
                url = '/api/reports/overview';
            } else {
                const params = new URLSearchParams();
                if (range?.from) params.set('from', range.from);
                if (range?.to) params.set('to', range.to);
                const qs = params.toString();
                url = `/api/reports/${domain}${qs ? `?${qs}` : ''}`;
            }
            const result = await apiFetch(url);
            if (mountedRef.current && domainRef.current === capturedDomain) {
                setData(result?.data ?? null);
            }
        } catch (err) {
            if (mountedRef.current && domainRef.current === capturedDomain) {
                setError(err.message);
            }
        } finally {
            if (mountedRef.current && domainRef.current === capturedDomain) {
                setLoading(false);
            }
        }
    }, [domain, range?.from, range?.to]);

    useEffect(() => {
        mountedRef.current = true;
        fetch();
        return () => {
            mountedRef.current = false;
        };
    }, [fetch]);

    return { data, loading, error, refresh: fetch };
}
