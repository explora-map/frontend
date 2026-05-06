// App.jsx
// Router setup. All routes defined here.
// ProtectedRoute wraps any page that requires authentication.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Sprint 2 pages
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// Sprint 3 pages
import MapaListPage from './pages/MapaListPage';
import MapaCrearPage from './pages/MapaCrearPage';
import MapaDetallePage from './pages/MapaDetallePage';
import MapaEditarPage from './pages/MapaEditarPage';
import ConvitesPage from './pages/ConvitesPage';

function Protected({ children }) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
    return (
        <BrowserRouter>
            {/*
                AuthProvider wraps the entire router so that all pages
                and the ProtectedRoute component can access auth state.
            */}
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login"    element={<LoginPage />} />

                    {/* Protected routes — Sprint 2 */}
                    <Route
                        path="/dashboard"
                        element={
                            <Protected>
                                <DashboardPage />
                            </Protected>
                        }
                    />

                    {/* Protected routes — Sprint 3: maps */}
                    <Route
                        path="/mapas"
                        element={
                            <Protected>
                                <MapaListPage />
                            </Protected>
                        }
                    />
                    <Route
                        path="/mapas/novo"
                        element={
                            <Protected>
                                <MapaCrearPage />
                            </Protected>
                        }
                    />
                    {/*
                        /mapas/novo must be declared before /mapas/:id so that
                        React Router does not treat "novo" as a dynamic segment.
                    */}
                    <Route
                        path="/mapas/:id"
                        element={
                            <Protected>
                                <MapaDetallePage />
                            </Protected>
                        }
                    />
                    <Route
                        path="/mapas/:id/editar"
                        element={
                            <Protected>
                                <MapaEditarPage />
                            </Protected>
                        }
                    />

                    {/* Protected routes — Sprint 3: invitations */}
                    <Route
                        path="/convites"
                        element={
                            <Protected>
                                <ConvitesPage />
                            </Protected>
                        }
                    />

                    {/* Default redirect */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}
