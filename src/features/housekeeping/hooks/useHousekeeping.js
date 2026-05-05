import { useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch, apiJson } from '@utils/api';

export const CLEANING_STATUSES = {
    DIRTY: 'dirty',
    CLEAN: 'clean',
    MAINTENANCE: 'maintenance',
    INSPECTION: 'inspection',
};

export const ASSIGNMENT_STATUSES = {
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    INSPECTION: 'inspection',
};

export const KANBAN_COLUMNS = [
    { key: 'dirty', label: 'Sucia', color: 'border-t-yellow-500' },
    { key: 'assigned', label: 'Asignada', color: 'border-t-blue-500' },
    { key: 'in_progress', label: 'Limpiando', color: 'border-t-orange-500' },
    { key: 'inspection', label: 'Inspección', color: 'border-t-purple-500' },
    { key: 'clean', label: 'Limpia', color: 'border-t-emerald-500' },
];

export function getKanbanStatus(room) {
    if (room.housekeeping_status === 'maintenance') return 'dirty';
    if (room.housekeeping_status === 'inspection') return 'inspection';
    if (room.housekeeping_status === 'clean' && !room.assignment_id) return 'clean';
    if (room.assignment_status === 'assigned') return 'assigned';
    if (room.assignment_status === 'in_progress') return 'in_progress';
    if (room.assignment_status === 'completed') return 'inspection';
    if (room.assignment_status === 'inspection') return 'inspection';
    return 'dirty';
}

export function useHousekeeping() {
    const [rooms, setRooms] = useState([]);
    const [staff, setStaff] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);

    const fetchAll = useCallback(async () => {
        try {
            const [roomsData, staffData, statsData] = await Promise.all([
                apiFetch('/api/housekeeping/rooms'),
                apiFetch('/api/housekeeping/staff'),
                apiFetch('/api/housekeeping/stats'),
            ]);
            if (mountedRef.current) {
                setRooms(roomsData.rooms || []);
                setStaff(staffData.staff || []);
                setStats(statsData.stats || null);
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

    useEffect(() => {
        mountedRef.current = true;
        fetchAll();
        return () => { mountedRef.current = false; };
    }, [fetchAll]);

    const assignStaff = useCallback(async (staffId, roomIds) => {
        await apiJson('/api/housekeeping/assignments', {
            method: 'POST',
            body: { staff_id: staffId, room_ids: roomIds },
        });
        await fetchAll();
    }, [fetchAll]);

    const updateAssignmentStatus = useCallback(async (assignmentId, status) => {
        await apiJson(`/api/housekeeping/assignments/${assignmentId}`, {
            method: 'PATCH',
            body: { status },
        });
        await fetchAll();
    }, [fetchAll]);

    const inspectAssignment = useCallback(async (assignmentId, approved, notes) => {
        await apiJson(`/api/housekeeping/assignments/${assignmentId}/inspect`, {
            method: 'PATCH',
            body: { approved, notes },
        });
        await fetchAll();
    }, [fetchAll]);

    const unassignStaff = useCallback(async (assignmentId) => {
        await apiJson(`/api/housekeeping/assignments/${assignmentId}`, {
            method: 'DELETE',
        });
        await fetchAll();
    }, [fetchAll]);

    const createStaff = useCallback(async (data) => {
        await apiJson('/api/housekeeping/staff', {
            method: 'POST',
            body: data,
        });
        await fetchAll();
    }, [fetchAll]);

    const createIncident = useCallback(async (data) => {
        await apiJson('/api/housekeeping/incidents', {
            method: 'POST',
            body: data,
        });
        await fetchAll();
    }, [fetchAll]);

    return {
        rooms,
        staff,
        stats,
        loading,
        error,
        refetch: fetchAll,
        assignStaff,
        updateAssignmentStatus,
        inspectAssignment,
        unassignStaff,
        createStaff,
        createIncident,
    };
}
