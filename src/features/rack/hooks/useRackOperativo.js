import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '@utils/api';

const WS_URL = (() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/rack/ws`;
})();

const POLL_INTERVAL = 30000;

export function useRackOperativo() {
    const [rooms, setRooms] = useState([]);
    const [arrivals, setArrivals] = useState([]);
    const [departures, setDepartures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);
    const pollRef = useRef(null);
    const mountedRef = useRef(true);

    const fetchRooms = useCallback(async () => {
        try {
            const data = await apiFetch('/api/rack/rooms');
            if (mountedRef.current) {
                setRooms(data.rooms || []);
                setError(null);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    const fetchArrivalsDepartures = useCallback(async () => {
        try {
            const [arrData, depData] = await Promise.all([
                apiFetch('/api/rack/arrivals'),
                apiFetch('/api/rack/departures'),
            ]);
            if (mountedRef.current) {
                setArrivals(arrData.arrivals || []);
                setDepartures(depData.departures || []);
            }
        } catch {
            // Silently fail for arrivals/departures — non-critical
        }
    }, []);

    const connectWebSocket = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                if (!mountedRef.current) return;
                setConnected(true);
                setError(null);
                clearInterval(pollRef.current);
            };

            ws.onmessage = (event) => {
                if (!mountedRef.current) return;
                try {
                    const msg = JSON.parse(event.data);
                    if (msg.event === 'snapshot') {
                        setRooms(msg.rooms || []);
                        setLoading(false);
                    } else if (msg.event === 'room_update') {
                        setRooms(prev => prev.map(r => {
                            if (r.id === msg.room_id) {
                                return { ...r, ...msg.changes };
                            }
                            return r;
                        }));
                    } else if (msg.event === 'full_sync') {
                        fetchRooms();
                    }
                } catch {
                    // ignore malformed messages
                }
            };

            ws.onclose = () => {
                if (!mountedRef.current) return;
                setConnected(false);
                wsRef.current = null;
                // Start polling as fallback
                if (!pollRef.current) {
                    pollRef.current = setInterval(fetchRooms, POLL_INTERVAL);
                }
            };

            ws.onerror = () => {
                if (!mountedRef.current) return;
                setConnected(false);
                wsRef.current = null;
            };
        } catch {
            setConnected(false);
        }
    }, [fetchRooms]);

    useEffect(() => {
        mountedRef.current = true;
        setLoading(true);
        fetchRooms().then(() => {
            connectWebSocket();
        });
        fetchArrivalsDepartures();

        return () => {
            mountedRef.current = false;
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [fetchRooms, connectWebSocket, fetchArrivalsDepartures]);

    return { rooms, arrivals, departures, loading, connected, error, refetch: fetchRooms };
}