import { useState } from "react";

import { loginUser, registerUser } from "../api/authApi";

import { AuthContext } from "./AuthContext";

// Provide authentication state and functions to child components
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // Log in and store the authenticated user and JWT
    async function login(email, password) {
        const data = await loginUser(email, password);

        setUser(data.user);
        setToken(data.token);
    }

    // Register a new account and store the user and JWT
    async function register(email, password) {
        const data = await registerUser(email, password);

        setUser(data.user);
        setToken(data.token);
    }

    // Log out by clearing the authentication state
    function logout() {
        setUser(null);
        setToken(null);
    }

    return (
        <AuthContext.Provider
            value={{ user, token, login, register, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}
