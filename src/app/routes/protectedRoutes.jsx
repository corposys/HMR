import { lazy } from 'react';

const Dashboard = lazy(() => import('@features/dashboard/pages/Dashboard'));
const Settings = lazy(() => import('@features/settings/pages/Settings'));
const Signatures = lazy(() => import('@features/signatures/pages/Signatures'));
const SignaturesHistory = lazy(() => import('@features/signatures/pages/SignaturesHistory'));
const LockHealthDashboard = lazy(() => import('@features/maintenance/pages/LockHealthDashboard'));
const LockTimelinePage = lazy(() => import('@features/maintenance/pages/LockTimelinePage'));
const LocksRackPage = lazy(() => import('@features/maintenance/pages/LocksRackPage'));
const VehicleControl = lazy(() => import('@features/security/pages/VehicleControl'));
const Linen = lazy(() => import('@features/housekeeping/pages/Linen'));
const Reservations = lazy(() => import('@features/reception/pages/Reservations'));

export const protectedRoutes = [
    { index: true, element: <Dashboard /> },
    { path: 'signatures', element: <SignaturesHistory /> },
    { path: 'signatures/new', element: <Signatures /> },
    { path: 'maintenance', element: <LocksRackPage /> },
    { path: 'maintenance/dashboard', element: <LockHealthDashboard /> },
    { path: 'maintenance/room/:id', element: <LockTimelinePage /> },
    { path: 'maintenance/rooms', element: <LocksRackPage /> },
    { path: 'security/vehicle-control', element: <VehicleControl /> },
    { path: 'housekeeping/lenceria', element: <Linen /> },
    { path: 'reception/reservas', element: <Reservations /> },
    { path: 'settings', element: <Settings /> },
];
