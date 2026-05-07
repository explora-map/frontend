// ProtectedRoute.jsx
// Wraps any route that requires authentication.
// If the user is not authenticated, redirects to /login,
// preserving the intended destination in location state so
// LoginPage can redirect back after a successful login.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute() {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}
