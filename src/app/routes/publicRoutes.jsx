import { lazy } from 'react';

const Login = lazy(() => import('@features/auth/pages/Login'));
const Register = lazy(() => import('@features/auth/pages/Register'));
const PublicTicketForm = lazy(() => import('@features/systems/tickets/pages/PublicTicketForm'));

export const publicRoutes = [
    { path: '/login', element: <Login /> },
    { path: '/register', element: <Register /> },
    { path: '/soporte', element: <PublicTicketForm /> },
];
