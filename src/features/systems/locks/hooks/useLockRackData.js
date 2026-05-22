import { useMemo } from 'react';
import { getUrgencyScore, getRackPriorityScore } from '../utils/lockHelpers';

export function useLockRackData(locks, predictionsByRoom, search, statusFilter) {
    const filteredLocks = useMemo(() => {
        const q = search.trim().toLowerCase();
        return locks.filter((item) => {
            if (item.room_status !== 'active') {
                return false;
            }

            if (item.floor_is_active === false || item.module_is_active === false) {
                return false;
            }

            if (statusFilter !== 'all' && item.status !== statusFilter) {
                return false;
            }

            if (!q) {
                return true;
            }

            return (
                item.room_number?.toLowerCase().includes(q)
                || item.floor_code?.toLowerCase().includes(q)
                || item.module_name?.toLowerCase().includes(q)
                || (item.code || '').toLowerCase().includes(q)
            );
        });
    }, [locks, search, statusFilter]);

    const groupedLocks = useMemo(() => {
        return [...filteredLocks]
            .map((item) => ({
                ...item,
                prediction: predictionsByRoom[item.room_id] || null,
            }))
            .sort((a, b) => {
                const priorityA = getRackPriorityScore(a);
                const priorityB = getRackPriorityScore(b);
                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }

                const moduleA = Number(a.module_number) || Number(a.module_id) || 0;
                const moduleB = Number(b.module_number) || Number(b.module_id) || 0;
                if (moduleA !== moduleB) {
                    return moduleA - moduleB;
                }

                const floorA = String(a.floor_code || '').toUpperCase();
                const floorB = String(b.floor_code || '').toUpperCase();
                if (floorA !== floorB) {
                    if (floorA === 'PB') return -1;
                    if (floorB === 'PB') return 1;
                    return floorA.localeCompare(floorB, undefined, { numeric: true });
                }

                return String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true });
            });
    }, [filteredLocks, predictionsByRoom]);

    const groupedPriorityByModule = useMemo(() => {
        const modules = {};
        filteredLocks.forEach((item) => {
            const key = String(item.module_id || 'nomodule');
            if (!modules[key]) modules[key] = { moduleId: item.module_id, moduleName: item.module_name, moduleNumber: item.module_number, rooms: [] };
            modules[key].rooms.push({ ...item, prediction: predictionsByRoom[item.room_id] || null });
        });

        const moduleArray = Object.values(modules).map((m) => {
            const rooms = m.rooms.sort((a, b) => getRackPriorityScore(a) - getRackPriorityScore(b));
            const urgency = rooms.reduce((acc, r) => Math.min(acc, getUrgencyScore(r, r.prediction)), Infinity);
            return { ...m, rooms, urgency };
        });

        moduleArray.sort((a, b) => (a.urgency - b.urgency) || ((a.moduleId || 0) - (b.moduleId || 0)));

        return moduleArray;
    }, [filteredLocks, predictionsByRoom]);

    const groupedByModule = useMemo(() => {
        const modules = {};
        filteredLocks.forEach((item) => {
            const key = String(item.module_id);
            if (!modules[key]) {
                modules[key] = {
                    moduleId: item.module_id,
                    moduleName: item.module_name,
                    moduleNumber: item.module_number,
                    rooms: [],
                };
            }
            modules[key].rooms.push({
                ...item,
                prediction: predictionsByRoom[item.room_id] || null,
            });
        });

        return Object.values(modules)
            .sort((a, b) => a.moduleId - b.moduleId)
            .map((module) => ({
                ...module,
                rooms: module.rooms.sort((a, b) => String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true })),
            }));
    }, [filteredLocks, predictionsByRoom]);

    const groupedByStructure = useMemo(() => {
        const modules = {};
        filteredLocks.forEach((item) => {
            const moduleKey = String(item.module_id);
            if (!modules[moduleKey]) {
                modules[moduleKey] = {
                    moduleId: item.module_id,
                    moduleName: item.module_name,
                    moduleNumber: item.module_number,
                    floors: {},
                };
            }

            const floorKey = String(item.floor_code || '');
            if (!modules[moduleKey].floors[floorKey]) {
                modules[moduleKey].floors[floorKey] = {
                    floorCode: item.floor_code,
                    rooms: [],
                };
            }

            modules[moduleKey].floors[floorKey].rooms.push({
                ...item,
                prediction: predictionsByRoom[item.room_id] || null,
            });
        });

        return Object.values(modules)
            .sort((a, b) => a.moduleId - b.moduleId)
            .map((module) => ({
                ...module,
                floors: Object.values(module.floors)
                    .sort((a, b) => {
                        const codeA = String(a.floorCode || '').toUpperCase();
                        const codeB = String(b.floorCode || '').toUpperCase();
                        if (codeA === 'PB') return -1;
                        if (codeB === 'PB') return 1;
                        return codeA.localeCompare(codeB, undefined, { numeric: true });
                    })
                    .map((floor) => ({
                        ...floor,
                        rooms: floor.rooms.sort((a, b) => String(a.room_number).localeCompare(String(b.room_number), undefined, { numeric: true })),
                    })),
            }));
    }, [filteredLocks, predictionsByRoom]);

    const operationalSummary = useMemo(() => {
        const total = filteredLocks.length;
        const needsReview = filteredLocks.filter((item) => item.status === 'needs_review').length;
        const outOfService = filteredLocks.filter((item) => item.status === 'out_of_service').length;
        const healthy = filteredLocks.filter((item) => item.status === 'operational').length;
        const overdue = filteredLocks.filter((item) => {
            const prediction = predictionsByRoom[item.room_id];
            return item.status === 'out_of_service' || (prediction && prediction.days_remaining <= 0);
        }).length;

        return { total, needsReview, outOfService, healthy, overdue };
    }, [filteredLocks, predictionsByRoom]);

    const priorityLocks = useMemo(() => {
        return [...filteredLocks]
            .map((item) => ({
                ...item,
                prediction: predictionsByRoom[item.room_id] || null,
            }))
            .filter((item) => item.status !== 'operational' || item.prediction?.days_remaining <= 15)
            .sort((a, b) => {
                const scoreA = getUrgencyScore(a, a.prediction);
                const scoreB = getUrgencyScore(b, b.prediction);
                if (scoreA !== scoreB) return scoreA - scoreB;
                return a.room_number.localeCompare(b.room_number, undefined, { numeric: true });
            })
            .slice(0, 8);
    }, [filteredLocks, predictionsByRoom]);

    return {
        filteredLocks,
        groupedLocks,
        groupedPriorityByModule,
        groupedByModule,
        groupedByStructure,
        operationalSummary,
        priorityLocks,
    };
}
