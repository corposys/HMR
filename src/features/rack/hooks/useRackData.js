import { useMemo } from 'react';
import { getRackState } from '../utils/rackHelpers';

export { RACK_STATES, RACK_STATE_LABELS, RACK_STATE_COLORS, getRackState, getStateColors } from '../utils/rackHelpers';

export function useRackData(rooms, filters) {
    const { floorFilter, typeFilter, stateFilter, searchQuery } = filters;

    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            if (floorFilter && room.floor_id !== Number(floorFilter)) return false;
            if (typeFilter && room.room_type_id !== Number(typeFilter)) return false;

            const state = getRackState(room);
            if (stateFilter && state !== stateFilter) return false;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchRoom = room.room_number.toLowerCase().includes(q);
                const matchGuest = room.guest_name?.toLowerCase().includes(q);
                const matchType = room.room_type_name?.toLowerCase().includes(q);
                if (!matchRoom && !matchGuest && !matchType) return false;
            }

            return true;
        });
    }, [rooms, floorFilter, typeFilter, stateFilter, searchQuery]);

    const groupedRooms = useMemo(() => {
        const byModule = {};
        filteredRooms.forEach(room => {
            const modKey = room.module_id;
            if (!byModule[modKey]) {
                byModule[modKey] = {
                    module_id: room.module_id,
                    module_name: room.module_name,
                    module_number: room.module_number,
                    floors: {},
                };
            }
            const floorKey = room.floor_id;
            if (!byModule[modKey].floors[floorKey]) {
                byModule[modKey].floors[floorKey] = {
                    floor_id: room.floor_id,
                    floor_code: room.floor_code,
                    floor_name: room.floor_name,
                    rooms: [],
                };
            }
            byModule[modKey].floors[floorKey].rooms.push(room);
        });

        return Object.values(byModule)
            .sort((a, b) => a.module_number - b.module_number)
            .map(mod => ({
                ...mod,
                floors: Object.values(mod.floors)
                    .sort((a, b) => {
                        const aNum = parseInt(a.floor_code, 10);
                        const bNum = parseInt(b.floor_code, 10);
                        return (isNaN(aNum) ? 0 : aNum) - (isNaN(bNum) ? 0 : bNum);
                    })
                    .map(floor => ({
                        ...floor,
                        rooms: floor.rooms.sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true })),
                    })),
            }));
    }, [filteredRooms]);

    const stats = useMemo(() => {
        const counts = {
            total: rooms.length,
            available: 0,
            occupied: 0,
            reserved: 0,
            dirty: 0,
            maintenance: 0,
            blocked: 0,
            fdu: 0,
        };
        rooms.forEach(room => {
            const state = getRackState(room);
            if (counts[state] !== undefined) counts[state]++;
        });
        return counts;
    }, [rooms]);

    const uniqueFloors = useMemo(() => {
        const map = new Map();
        rooms.forEach(r => map.set(r.floor_id, { id: r.floor_id, code: r.floor_code, name: r.floor_name }));
        return Array.from(map.values()).sort((a, b) => {
            const aNum = parseInt(a.code, 10);
            const bNum = parseInt(b.code, 10);
            return (isNaN(aNum) ? 0 : aNum) - (isNaN(bNum) ? 0 : bNum);
        });
    }, [rooms]);

    const uniqueTypes = useMemo(() => {
        const map = new Map();
        rooms.forEach(r => {
            if (r.room_type_id) {
                map.set(r.room_type_id, { id: r.room_type_id, name: r.room_type_name });
            }
        });
        return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [rooms]);

    return { filteredRooms, groupedRooms, stats, uniqueFloors, uniqueTypes };
}
