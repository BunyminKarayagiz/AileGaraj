
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Family from "./pages/Family";
import { useAuth } from "./context/AuthContext";
import Vehicles from "./pages/Vehicles";
import VehicleCreate from "./pages/VehicleCreate";
import Reservations from "./pages/Reservations";
import Expenses from "./pages/Expenses";
import Reports from "./pages/Reports";
function AppRoutes() {
    const { isAuthenticated } = useAuth();
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <Navigate
                        to={isAuthenticated ? "/dashboard" : "/login"}
                        replace
                    />
                }
            />

            <Route
                path="/login"
                element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
                }
            />

            <Route
                path="/register"
                element={
                    isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
                }
            />

            <Route
                path="/dashboard"
                element={
                    isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
                }
            />

            <Route
                path="/family"
                element={
                    isAuthenticated ? <Family /> : <Navigate to="/login" replace />
                }
            />
            <Route
                path="/vehicles"
                element={
                    isAuthenticated ? <Vehicles /> : <Navigate to="/login" replace />
                }
            />

            <Route
                path="/reservations"
                element={
                    isAuthenticated ? (
                        <Reservations />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />

            <Route
                path="/vehicles/create"
                element={
                    isAuthenticated ? <VehicleCreate /> : <Navigate to="/login" replace />
                }
            />

            <Route path="/expenses" element={
                isAuthenticated ? (
                    <Expenses />
                ) : (
                    <Navigate to="/login" replace />
                )
            } />

            <Route path="/reports" element={
                isAuthenticated ? (
                    <Reports />
                ) : (
                    <Navigate to="/login" replace />
                )
            } />

            <Route
                path="*"
                element={
                    <Navigate
                        to={isAuthenticated ? "/dashboard" : "/login"}
                        replace
                    />
                }
            />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

export default App;
