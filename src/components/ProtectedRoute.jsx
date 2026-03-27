// ProtectedRoute.jsx
// Wraps any route that requires authentication.
// If the user is not authenticated, redirects to /login,
// preserving the intended destination in location state so
// LoginPage can redirect back after a successful login.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                state={{ from: location, message: 'Please log in to continue.' }}
                replace
            />
        );
    }

    return children;
}