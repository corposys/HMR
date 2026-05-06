import { lazy } from 'react';

const Dashboard = lazy(() => import('@features/dashboard/pages/Dashboard'));
const Settings = lazy(() => import('@features/settings/pages/SettingsPage'));
const Signatures = lazy(() => import('@features/signatures/pages/Signatures'));
const SignaturesHistory = lazy(() => import('@features/signatures/pages/SignaturesHistory'));
const Habitaciones = lazy(() => import('@features/maintenance/pages/Habitaciones'));
const LockHealthDashboard = lazy(() => import('@features/maintenance/locks/pages/LockHealthDashboard'));
const LockTimelinePage = lazy(() => import('@features/maintenance/locks/pages/LockTimelinePage'));
const LocksRackPage = lazy(() => import('@features/maintenance/locks/pages/LocksRackPage'));
const VehicleControl = lazy(() => import('@features/security/pages/VehicleControl'));
const Linen = lazy(() => import('@features/housekeeping/pages/Linen'));
const HousekeepingPage = lazy(() => import('@features/housekeeping/pages/Housekeeping'));
const MaidPanel = lazy(() => import('@features/housekeeping/pages/MaidPanel'));
const InspectionPage = lazy(() => import('@features/housekeeping/pages/InspectionPage'));
const IncidentsPage = lazy(() => import('@features/housekeeping/pages/IncidentsPage'));
const StaffPage = lazy(() => import('@features/housekeeping/pages/StaffPage'));
const HousekeepingDashboard = lazy(() => import('@features/housekeeping/pages/HousekeepingDashboard'));
const Reservations = lazy(() => import('@features/reservations/pages/Reservations'));
const ReservationsDashboard = lazy(() => import('@features/reservations/pages/ReservationsDashboard'));
const RatesPage = lazy(() => import('@features/reservations/pages/RatesPage'));
const RackOperativo = lazy(() => import('@features/rack/pages/RackOperativo'));
const OperationsPage = lazy(() => import('@features/reception/pages/OperationsPage'));
const FoliosPage = lazy(() => import('@features/reception/pages/FoliosPage'));
const WalkInsPage = lazy(() => import('@features/reception/pages/WalkInsPage'));
const AuditPage = lazy(() => import('@features/reception/pages/AuditPage'));
const LogbookPage = lazy(() => import('@features/reception/pages/LogbookPage'));
const ReceptionDashboard = lazy(() => import('@features/reception/pages/ReceptionDashboard'));
const DemoRackPage = lazy(() => import('@features/demo-rack/pages/DemoRackPage'));

export const protectedRoutes = [
    { index: true, element: <Dashboard /> },
    { path: 'rack', element: <RackOperativo /> },
    { path: 'reception/dashboard', element: <ReceptionDashboard /> },
    { path: 'reception/operations', element: <OperationsPage /> },
    { path: 'reception/folios', element: <FoliosPage /> },
    { path: 'reception/walkins', element: <WalkInsPage /> },
    { path: 'reception/audit', element: <AuditPage /> },
    { path: 'reception/logbook', element: <LogbookPage /> },
    { path: 'reservaciones', element: <Reservations /> },
    { path: 'reservaciones/dashboard', element: <ReservationsDashboard /> },
    { path: 'reservaciones/tarifas', element: <RatesPage /> },
    { path: 'reception/reservas', element: <Reservations /> },
    { path: 'systems/signatures', element: <SignaturesHistory /> },
    { path: 'systems/signatures/new', element: <Signatures /> },
    { path: 'maintenance', element: <Habitaciones /> },
    { path: 'maintenance/habitaciones', element: <Habitaciones /> },
    { path: 'maintenance/room/:id', element: <LockTimelinePage /> },
    { path: 'systems/rooms', element: <LocksRackPage /> },
    { path: 'maintenance/dashboard', element: <LockHealthDashboard /> },
    { path: 'security/vehicle-control', element: <VehicleControl /> },
    { path: 'housekeeping', element: <HousekeepingPage /> },
    { path: 'housekeeping/dashboard', element: <HousekeepingDashboard /> },
    { path: 'housekeeping/panel', element: <MaidPanel /> },
    { path: 'housekeeping/inspeccion', element: <InspectionPage /> },
    { path: 'housekeeping/incidencias', element: <IncidentsPage /> },
    { path: 'housekeeping/personal', element: <StaffPage /> },
    { path: 'housekeeping/lenceria', element: <Linen /> },
    { path: 'settings', element: <Settings /> },
    { path: 'demo-rack', element: <DemoRackPage /> },
];
