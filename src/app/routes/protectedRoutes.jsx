import { lazy } from 'react';

const Dashboard = lazy(() => import('@features/dashboard/pages/Dashboard'));
const Settings = lazy(() => import('@features/settings/pages/Settings'));
const Signatures = lazy(() => import('@features/signatures/pages/Signatures'));
const SignaturesHistory = lazy(() => import('@features/signatures/pages/SignaturesHistory'));
const Habitaciones = lazy(() => import('@features/maintenance/pages/Habitaciones'));
const LockHealthDashboard = lazy(() => import('@features/maintenance/locks/pages/LockHealthDashboard'));
const LockTimelinePage = lazy(() => import('@features/maintenance/locks/pages/LockTimelinePage'));
const LocksRackPage = lazy(() => import('@features/maintenance/locks/pages/LocksRackPage'));
const VehicleControl = lazy(() => import('@features/security/pages/VehicleControl'));
const Linen = lazy(() => import('@features/housekeeping/pages/Linen'));
const Reservations = lazy(() => import('@features/reception/pages/Reservations'));
const RackPage = lazy(() => import('@features/reception/pages/RackPage'));

export const protectedRoutes = [
    { index: true, element: <Dashboard /> },
    { path: 'reception/rack', element: <RackPage /> },
    { path: 'reception/reservas', element: <Reservations /> },
    { path: 'signatures', element: <SignaturesHistory /> },
    { path: 'signatures/new', element: <Signatures /> },
    { path: 'maintenance', element: <Habitaciones /> },
    { path: 'maintenance/habitaciones', element: <Habitaciones /> },
    { path: 'maintenance/room/:id', element: <LockTimelinePage /> },
    { path: 'maintenance/rooms', element: <LocksRackPage /> },
    { path: 'maintenance/dashboard', element: <LockHealthDashboard /> },
    { path: 'security/vehicle-control', element: <VehicleControl /> },
    { path: 'housekeeping/lenceria', element: <Linen /> },
    { path: 'settings', element: <Settings /> },
];