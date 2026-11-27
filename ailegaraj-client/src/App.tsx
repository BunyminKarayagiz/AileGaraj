
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import AppLayout from "./components/AppLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Family from "./pages/Family";
import Vehicles from "./pages/Vehicles";
import VehicleCreate from "./pages/VehicleCreate";
import Reservations from "./pages/Reservations";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
import VerifyEmail from "./pages/VerifyEmail";
import CheckEmail from "./pages/CheckEmail";
import Admin from "./pages/Admin";
import AdminFamilies from "./pages/AdminFamilies";
import AdminFamilyDetail from "./pages/AdminFamilyDetail";
import AdminUsers from "./pages/AdminUsers";
import AdminVehicles from "./pages/AdminVehicles";
import AdminReservations from "./pages/AdminReservations";
import AdminExpenses from "./pages/AdminExpenses";
import AdminLogs from "./pages/AdminLogs";

function AppRoutes() {
    const { user, isAuthenticated } = useAuth();

    const isSuperAdmin =
        user?.roles?.includes("SuperAdmin") ?? false;

    const defaultRoute = isSuperAdmin
        ? "/admin"
        : "/dashboard";

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    isAuthenticated
                        ? <Navigate to={defaultRoute} replace />
                        : <Login />
                }
            />

            <Route
                path="/register"
                element={
                    isAuthenticated
                        ? <Navigate to={defaultRoute} replace />
                        : <Register />
                }
            />

            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/check-email" element={<CheckEmail />} />

            <Route
                element={
                    isAuthenticated
                        ? <AppLayout />
                        : <Navigate to="/login" replace />
                }
            >
                <Route
                    path="/admin"
                    element={
                        isSuperAdmin
                            ? <Admin />
                            : <Navigate to="/dashboard" replace />
                    }
                />

                <Route
                    path="/admin/families"
                    element={
                        isSuperAdmin
                            ? <AdminFamilies />
                            : <Navigate to="/dashboard" replace />
                    }
                />

                <Route
                    path="/admin/families/:id"
                    element={
                        isSuperAdmin
                            ? <AdminFamilyDetail />
                            : <Navigate to="/dashboard" replace />
                    }
                />

                <Route
                    path="/admin/users"
                    element={isSuperAdmin ? <AdminUsers /> : <Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/admin/users/:id"
                    element={isSuperAdmin ? <AdminUsers /> : <Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/admin/vehicles"
                    element={isSuperAdmin ? <AdminVehicles /> : <Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/admin/vehicles/:id"
                    element={isSuperAdmin ? <AdminVehicles /> : <Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/admin/reservations"
                    element={isSuperAdmin ? <AdminReservations /> : <Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/admin/reservations/:id"
                    element={isSuperAdmin ? <AdminReservations /> : <Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/admin/expenses"
                    element={isSuperAdmin ? <AdminExpenses /> : <Navigate to="/dashboard" replace />}
                />
                <Route
                    path="/admin/logs"
                    element={isSuperAdmin ? <AdminLogs /> : <Navigate to="/dashboard" replace />}
                />

                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/family" element={<Family />} />
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/vehicles/create" element={<VehicleCreate />} />
                <Route path="/reservations" element={<Reservations />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/reports" element={<Reports />} />
            </Route>

            <Route
                path="/"
                element={<Navigate to={defaultRoute} replace />}
            />

            <Route
                path="*"
                element={
                    <Navigate
                        to={isAuthenticated ? defaultRoute : "/login"}
                        replace
                    />
                }
            />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}
