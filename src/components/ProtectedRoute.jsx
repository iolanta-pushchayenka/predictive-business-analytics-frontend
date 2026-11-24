import { Navigate, Outlet } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute() {
    const { user, token, initializing } = useAuth();

    if (initializing) {
        return <p role="status">Checking your session...</p>;
    }

    if (!user || !token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
