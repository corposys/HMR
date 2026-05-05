import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@utils/api';
import { DEFAULT_SETTINGS } from '@utils/constants';

let settingsCache = null;
let settingsPromise = null;
let listeners = [];

function notifyListeners() {
    listeners.forEach((fn) => fn(settingsCache));
}

async function fetchSettingsFromApi(setIsLoading, setError, setSettings, mountedRef) {
    if (settingsPromise) {
        try {
            const result = await settingsPromise;
            if (mountedRef.current) {
                setSettings(result);
                setIsLoading(false);
            }
        } catch {
            // already handled
        }
        return;
    }

    setIsLoading(true);
    setError(null);
    settingsPromise = apiFetch('/api/settings')
        .then((data) => {
            settingsCache = data.settings;
            notifyListeners();
            return data.settings;
        })
        .catch((err) => {
            setError(err.message);
            settingsCache = { ...DEFAULT_SETTINGS };
            notifyListeners();
            return settingsCache;
        })
        .finally(() => {
            settingsPromise = null;
            setIsLoading(false);
        });

    const result = await settingsPromise;
    if (mountedRef.current) setSettings(result);
}

export function useSettings() {
    const [settings, setSettings] = useState(() => settingsCache);
    const [isLoading, setIsLoading] = useState(() => !settingsCache);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);
    const initializedRef = useRef(false);

    const loadSettings = useCallback(() => {
        return fetchSettingsFromApi(setIsLoading, setError, setSettings, mountedRef);
    }, []);

    useEffect(() => {
        const listener = (newSettings) => {
            if (mountedRef.current) setSettings(newSettings);
        };
        listeners.push(listener);

        if (!initializedRef.current) {
            initializedRef.current = true;
            if (!settingsCache) {
                loadSettings();
            }
        }

        return () => {
            mountedRef.current = false;
            listeners = listeners.filter((l) => l !== listener);
        };
    }, [loadSettings]);

    async function updateSettings(updates) {
        setError(null);
        try {
            const data = await apiFetch('/api/settings/batch', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: updates }),
            });
            settingsCache = data.settings;
            setSettings(data.settings);
            notifyListeners();
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }

    async function updateSetting(key, value) {
        setError(null);
        try {
            const data = await apiFetch(`/api/settings/${key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value }),
            });
            await refreshSettings();
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    }

    async function refreshSettings() {
        settingsPromise = null;
        settingsCache = null;
        return loadSettings();
    }

    function getSetting(key, fallback = '') {
        if (!settings) return DEFAULT_SETTINGS[key] ?? fallback;
        const category = findCategoryForKey(key);
        if (category && settings[category]) {
            const found = settings[category].find((s) => s.key === key);
            if (found) return found.value;
        }
        return DEFAULT_SETTINGS[key] ?? fallback;
    }

    function getCategorySettings(category) {
        if (!settings || !settings[category]) return [];
        return settings[category];
    }

    return {
        settings,
        isLoading,
        error,
        getSetting,
        getCategorySettings,
        updateSettings,
        updateSetting,
        refreshSettings,
    };
}

function findCategoryForKey(key) {
    const hotelKeys = ['hotel_name', 'hotel_address', 'hotel_phone', 'hotel_email', 'hotel_rif', 'hotel_logo_url', 'hotel_timezone', 'hotel_category', 'hotel_slogan', 'hotel_website'];
    const financialKeys = ['igtf_rate', 'iva_rate', 'early_checkin_surcharge', 'late_checkout_surcharge', 'allow_partial_payments', 'default_currency'];
    const reservationKeys = ['checkin_time', 'checkout_time', 'require_phone', 'max_upload_size_mb', 'whatsapp_number', 'reservation_sources', 'payment_methods', 'document_types', 'bracelet_colors'];
    const systemKeys = ['session_timeout_minutes', 'date_format'];

    if (hotelKeys.includes(key)) return 'hotel';
    if (financialKeys.includes(key)) return 'financial';
    if (reservationKeys.includes(key)) return 'reservations';
    if (systemKeys.includes(key)) return 'system';
    return null;
}

export function useBcvRate() {
    const [bcvRate, setBcvRate] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const mountedRef = useRef(true);

    useEffect(() => {
        apiFetch('/api/settings/bcv')
            .then((data) => {
                if (mountedRef.current && data.rate) {
                    setBcvRate(data.rate);
                }
            })
            .catch(() => {
                if (mountedRef.current) setBcvRate({ rate: 36.50, source: 'fallback' });
            })
            .finally(() => {
                if (mountedRef.current) setIsLoading(false);
            });

        return () => { mountedRef.current = false; };
    }, []);

    async function updateBcvRate(rate, source = 'manual') {
        const data = await apiFetch('/api/settings/bcv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rate, source }),
        });
        setBcvRate(data.rate);
        return data.rate;
    }

    return { bcvRate, isLoading, updateBcvRate };
}

export function useRoomTypes() {
    const [roomTypes, setRoomTypes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const mountedRef = useRef(true);

    useEffect(() => {
        apiFetch('/api/settings/room-types')
            .then((data) => {
                if (mountedRef.current) setRoomTypes(data.room_types);
            })
            .catch(() => {
                if (mountedRef.current) setRoomTypes([]);
            })
            .finally(() => {
                if (mountedRef.current) setIsLoading(false);
            });

        return () => { mountedRef.current = false; };
    }, []);

    return { roomTypes, isLoading };
}

export function useReservationPlans() {
    const [plans, setPlans] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const mountedRef = useRef(true);

    useEffect(() => {
        apiFetch('/api/settings/reservation-plans')
            .then((data) => {
                if (mountedRef.current) setPlans(data.plans);
            })
            .catch(() => {
                if (mountedRef.current) setPlans([]);
            })
            .finally(() => {
                if (mountedRef.current) setIsLoading(false);
            });

        return () => { mountedRef.current = false; };
    }, []);

    return { plans, isLoading };
}