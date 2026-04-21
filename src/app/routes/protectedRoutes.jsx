import { lazy } from 'react';

const Dashboard = lazy(() => import('@features/dashboard/pages/Dashboard'));
const Settings = lazy(() => import('@features/settings/pages/Settings'));
const Signatures = lazy(() => import('@features/signatures/pages/Signatures'));
const SignaturesHistory = lazy(() => import('@features/signatures/pages/SignaturesHistory'));
const MaintenanceHistory = lazy(() => import('@features/maintenance/pages/MaintenanceHistory'));
const MaintenanceDashboard = lazy(() => import('@features/maintenance/pages/MaintenanceDashboard'));
const RoomTimeline = lazy(() => import('@features/maintenance/pages/RoomTimeline'));
const RoomsMaintenance = lazy(() => import('@features/maintenance/pages/RoomsMaintenance'));
const VehicleControl = lazy(() => import('@features/security/pages/VehicleControl'));
const Linen = lazy(() => import('@features/housekeeping/pages/Linen'));
const Reservations = lazy(() => import('@features/reception/pages/Reservations'));

export const protectedRoutes = [
    { index: true, element: <Dashboard /> },
    { path: 'signatures', element: <SignaturesHistory /> },
    { path: 'signatures/new', element: <Signatures /> },
    { path: 'maintenance', element: <MaintenanceHistory /> },
    { path: 'maintenance/dashboard', element: <MaintenanceDashboard /> },
    { path: 'maintenance/room/:id', element: <RoomTimeline /> },
    { path: 'maintenance/rooms', element: <RoomsMaintenance /> },
    { path: 'security/vehicle-control', element: <VehicleControl /> },
    { path: 'housekeeping/lenceria', element: <Linen /> },
    { path: 'reception/reservas', element: <Reservations /> },
    { path: 'settings', element: <Settings /> },
];
