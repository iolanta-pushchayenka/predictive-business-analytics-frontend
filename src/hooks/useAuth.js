import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Access authentication data and functions
export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used within AuthProvider"
        );
    }

    return context;
}