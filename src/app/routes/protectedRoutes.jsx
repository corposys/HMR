import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

const Dashboard = lazy(() => import('@features/dashboard/pages/Dashboard'));
const SettingsLayout = lazy(() => import('@features/settings/layout/SettingsLayout'));
const SettingsGeneral = lazy(() => import('@features/settings/pages/GeneralSettingsTab/GeneralSettingsTab'));
const SettingsStructure = lazy(() => import('@features/settings/pages/StructureTab/StructureTab'));
const SignaturesHistory = lazy(() => import('@features/systems/signatures/pages/SignaturesHistory'));
const PrintersDashboard = lazy(() => import('@features/systems/printers/pages/PrintersDashboard'));
const LockTimelinePage = lazy(() => import('@features/systems/locks/pages/LockTimelinePage'));
const LocksRackPage = lazy(() => import('@features/systems/locks/pages/LocksRackPage'));
const TicketsDashboard = lazy(() => import('@features/systems/tickets/pages/TicketsDashboard'));
const TicketDetail = lazy(() => import('@features/systems/tickets/pages/TicketDetail'));
const ReportsPage = lazy(() => import('@features/reports/pages/ReportsPage'));

export const protectedRoutes = [
    { index: true, element: <Dashboard /> },
    { path: 'systems/signatures', element: <SignaturesHistory /> },
    { path: 'systems/printers', element: <PrintersDashboard /> },
    { path: 'systems/tickets', element: <TicketsDashboard /> },
    { path: 'systems/tickets/:id', element: <TicketDetail /> },
    { path: 'systems/room/:id', element: <LockTimelinePage /> },
    { path: 'systems/rooms', element: <LocksRackPage /> },
    { path: 'reportes', element: <ReportsPage /> },
    {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
            { index: true, element: <Navigate to="general" replace /> },
            { path: 'general', element: <SettingsGeneral /> },
            { path: 'structure', element: <SettingsStructure /> },
        ],
    },
];