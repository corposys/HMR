import { lazy } from 'react';

const Login = lazy(() => import('@features/auth/pages/Login'));
const Register = lazy(() => import('@features/auth/pages/Register'));
const QuoteLanding = lazy(() => import('@features/reservations/pages/QuoteLanding'));
const PublicTicketForm = lazy(() => import('@features/systems/tickets/pages/PublicTicketForm'));

export const publicRoutes = [
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    { path: '/quote', element: <QuoteLanding /> },
    { path: '/soporte', element: <PublicTicketForm /> },
];
