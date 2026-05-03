import { useContext, useMemo } from 'react';
import { AuthContext } from '@context/AuthContext';

const ROLE_PERMISSIONS_DEFAULTS = {
    settings: { read: false, write: false },
    users: { read: false, write: false, delete: false },
    reception: { read: false, write: false, close_folio: false, verify_payment: false },
    guests: { read: false, write: false },
    rooms: { read: false, write: false, block: false },
    housekeeping: { read: false, update_status: false },
    maintenance: { read: false, write: false },
    reports: { read: false },
    financial: { read: false, write: false },
};

export function usePermissions() {
    const { user } = useContext(AuthContext);

    const permissions = useMemo(() => {
        if (!user) return ROLE_PERMISSIONS_DEFAULTS;
        if (user.role_id === 1 || user.role === 'admin') {
            return {
                settings: { read: true, write: true },
                users: { read: true, write: true, delete: true },
                reception: { read: true, write: true, close_folio: true, verify_payment: true },
                guests: { read: true, write: true },
                rooms: { read: true, write: true, block: true },
                housekeeping: { read: true, update_status: true },
                maintenance: { read: true, write: true },
                reports: { read: true },
                financial: { read: true, write: true },
            };
        }
        const userPerms = user.permissions || {};
        const merged = { ...ROLE_PERMISSIONS_DEFAULTS };
        for (const [resource, actions] of Object.entries(userPerms)) {
            if (!merged[resource]) {
                merged[resource] = { ...actions };
            } else {
                merged[resource] = { ...merged[resource], ...actions };
            }
        }
        return merged;
    }, [user]);

    const can = useMemo(() => {
        return function can(resource, action) {
            if (!user) return false;
            if (user.role_id === 1 || user.role === 'admin') return true;
            const resourcePerms = permissions[resource];
            if (!resourcePerms) return false;
            return !!resourcePerms[action];
        };
    }, [permissions, user]);

    const isAdmin = user?.role_id === 1 || user?.role === 'admin';
    const isReceptionManager = user?.role_id === 2;
    const isReceptionist = user?.role_id === 3;

    return {
        permissions,
        can,
        isAdmin,
        isReceptionManager,
        isReceptionist,
        canManageSettings: can('settings', 'write'),
        canManageUsers: can('users', 'write'),
        canVerifyPayment: can('reception', 'verify_payment'),
        canCloseFolio: can('reception', 'close_folio'),
        canBlockRoom: can('rooms', 'block'),
        canReadFinancial: can('financial', 'read'),
        canWriteFinancial: can('financial', 'write'),
    };
}