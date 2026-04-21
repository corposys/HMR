import { Navigate } from 'react-router-dom';

export const fallbackRoute = {
    path: '*',
    element: <Navigate to="/" replace />,
};
