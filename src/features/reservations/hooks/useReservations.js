import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@utils/api';

export function useReservations(params = {}) {
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReservations = useCallback(async (searchParams = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const sp = new URLSearchParams();
            if (searchParams.status) sp.set('status', searchParams.status);
            if (searchParams.room_id) sp.set('room_id', searchParams.room_id);
            if (searchParams.guest_id) sp.set('guest_id', searchParams.guest_id);
            if (searchParams.date_from) sp.set('date_from', searchParams.date_from);
            if (searchParams.date_to) sp.set('date_to', searchParams.date_to);
            if (searchParams.limit) sp.set('limit', searchParams.limit);
            if (searchParams.offset) sp.set('offset', searchParams.offset);
            const qs = sp.toString();
            const data = await apiFetch(`/api/reception/reservations${qs ? `?${qs}` : ''}`);
            setReservations(data.reservations || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReservations(params);
    }, []);

    async function getReservation(id) {
        return apiFetch(`/api/reception/reservations/${id}`);
    }

    async function createReservation(resData) {
        const data = await apiFetch('/api/reception/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(resData),
        });
        await fetchReservations(params);
        return data;
    }

    async function updateReservation(id, updates) {
        const data = await apiFetch(`/api/reception/reservations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        await fetchReservations(params);
        return data;
    }

    async function checkin(id) {
        const data = await apiFetch(`/api/reception/reservations/${id}/checkin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        await fetchReservations(params);
        return data;
    }

    async function checkout(id) {
        const data = await apiFetch(`/api/reception/reservations/${id}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });
        await fetchReservations(params);
        return data;
    }

    return { reservations, isLoading, error, fetchReservations, getReservation, createReservation, updateReservation, checkin, checkout };
}

export function useReservationsDashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        apiFetch('/api/reception/reservations/dashboard')
            .then((data) => {
                if (mounted) setDashboard(data.dashboard);
            })
            .catch((err) => {
                if (mounted) setError(err.message);
            })
            .finally(() => {
                if (mounted) setIsLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    return { dashboard, isLoading, error };
}