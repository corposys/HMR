import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const Dashboard = lazy(() => import('@features/dashboard/pages/Dashboard'));
const SettingsLayout = lazy(() => import('@features/settings/layout/SettingsLayout'));
const SettingsGeneral = lazy(() => import('@features/settings/pages/GeneralSettingsTab/GeneralSettingsTab'));
const SettingsFinance = lazy(() => import('@features/settings/pages/FinanceTab/FinanceTab'));
const SettingsReservations = lazy(() => import('@features/settings/pages/ReservationsTab/ReservationsTab'));
const SettingsStructure = lazy(() => import('@features/settings/pages/StructureTab/StructureTab'));
const SettingsLocks = lazy(() => import('@features/settings/pages/LockTypesTab/LockTypesTab'));
const SettingsIntegrations = lazy(() => import('@features/settings/pages/IntegrationsTab/IntegrationsTab'));
const SettingsUsers = lazy(() => import('@features/settings/pages/UsersTab/UsersTab'));
const SettingsSystem = lazy(() => import('@features/settings/pages/SystemTab/SystemTab'));
const SignaturesHistory = lazy(() => import('@features/systems/signatures/pages/SignaturesHistory'));
const Habitaciones = lazy(() => import('@features/maintenance/pages/Habitaciones'));
const LockTimelinePage = lazy(() => import('@features/systems/locks/pages/LockTimelinePage'));
const LocksRackPage = lazy(() => import('@features/systems/locks/pages/LocksRackPage'));
const VehicleControl = lazy(() => import('@features/security/pages/VehicleControl'));
const Linen = lazy(() => import('@features/housekeeping/pages/Linen'));
const MaidPanel = lazy(() => import('@features/housekeeping/pages/MaidPanel'));
const InspectionPage = lazy(() => import('@features/housekeeping/pages/InspectionPage'));
const IncidentsPage = lazy(() => import('@features/housekeeping/pages/IncidentsPage'));
const StaffPage = lazy(() => import('@features/housekeeping/pages/StaffPage'));
const HousekeepingDashboard = lazy(() => import('@features/housekeeping/pages/HousekeepingDashboard'));
const HousekeepingOperacionesPage = lazy(() => import('@features/housekeeping/pages/HousekeepingOperacionesPage'));
const HousekeepingControlPage = lazy(() => import('@features/housekeeping/pages/HousekeepingControlPage'));
const HousekeepingGestionPage = lazy(() => import('@features/housekeeping/pages/HousekeepingGestionPage'));
const Reservations = lazy(() => import('@features/reservations/pages/Reservations'));
const RatesPage = lazy(() => import('@features/reservations/pages/RatesPage'));
const RackOperativo = lazy(() => import('@features/rack/pages/RackOperativo'));
const CheckInOutPage = lazy(() => import('@features/reception/pages/CheckInOutPage'));
const FoliosPage = lazy(() => import('@features/reception/pages/FoliosPage'));
const WalkInsPage = lazy(() => import('@features/reception/pages/WalkInsPage'));
const LogbookPage = lazy(() => import('@features/reception/pages/LogbookPage'));
const DemoRackPage = lazy(() => import('@features/demo-rack/pages/DemoRackPage'));
const BillingPage = lazy(() => import('@features/billing/pages/BillingPage'));
const AuditModulePage = lazy(() => import('@features/audit/pages/AuditModulePage'));
const AuditNocturnaPage = lazy(() => import('@features/audit/pages/AuditNocturnaPage'));

export const protectedRoutes = [
    { index: true, element: <Dashboard /> },
    { path: 'rack', element: <RackOperativo /> },
    { path: 'demo-rack', element: <DemoRackPage /> },
    { path: 'billing', element: <BillingPage /> },
    { path: 'reservaciones', element: <Reservations /> },
    { path: 'reservaciones/tarifario', element: <RatesPage /> },
    { path: 'reception/operations', element: <CheckInOutPage /> },
    { path: 'reception/folios', element: <FoliosPage /> },
    { path: 'reception/walkins', element: <WalkInsPage /> },
    { path: 'reception/logbook', element: <LogbookPage /> },
    { path: 'audit', element: <AuditModulePage /> },
    { path: 'audit/nocturna', element: <AuditNocturnaPage /> },
    { path: 'systems/signatures', element: <SignaturesHistory /> },
    { path: 'maintenance', element: <Habitaciones /> },
    { path: 'maintenance/habitaciones', element: <Habitaciones /> },
    { path: 'systems/room/:id', element: <LockTimelinePage /> },
    { path: 'systems/rooms', element: <LocksRackPage /> },
    { path: 'security/vehicle-control', element: <VehicleControl /> },
    { path: 'housekeeping', element: <HousekeepingDashboard /> },
    { path: 'housekeeping/operaciones', element: <HousekeepingOperacionesPage /> },
    { path: 'housekeeping/control', element: <HousekeepingControlPage /> },
    { path: 'housekeeping/gestion', element: <HousekeepingGestionPage /> },
    { path: 'housekeeping/dashboard', element: <HousekeepingDashboard /> },
    { path: 'housekeeping/panel', element: <MaidPanel /> },
    { path: 'housekeeping/inspeccion', element: <InspectionPage /> },
    { path: 'housekeeping/incidencias', element: <IncidentsPage /> },
    { path: 'housekeeping/personal', element: <StaffPage /> },
    { path: 'housekeeping/lenceria', element: <Linen /> },
<<<<<<< HEAD
    {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
            { index: true, element: <Navigate to="general" replace /> },
            { path: 'general', element: <SettingsGeneral /> },
            { path: 'finance', element: <SettingsFinance /> },
            { path: 'reservations', element: <SettingsReservations /> },
            { path: 'structure', element: <SettingsStructure /> },
            { path: 'locks', element: <SettingsLocks /> },
            { path: 'integrations', element: <SettingsIntegrations /> },
            { path: 'users', element: <SettingsUsers /> },
            { path: 'system', element: <SettingsSystem /> },
        ],
    },
    { path: 'demo-rack', element: <DemoRackPage /> },
];
=======
    { path: 'settings', element: <Settings /> },
];
>>>>>>> 387601d13f705bd9bd0aa3391735eaf4d6784e9b
