// import { useState } from "react";

// import { loginUser, registerUser } from "../api/authApi";

// import { AuthContext } from "./AuthContext";

// // Provide authentication state and functions to child components
// export function AuthProvider({ children }) {
//     const [user, setUser] = useState(null);
//     const [token, setToken] = useState(null);

//     // Log in and store the authenticated user and JWT
//     async function login(email, password) {
//         const data = await loginUser(email, password);

//         setUser(data.user);
//         setToken(data.token);
//     }

//     // Register a new account and store the user and JWT
//     async function register(email, password) {
//         const data = await registerUser(email, password);

//         setUser(data.user);
//         setToken(data.token);
//     }

//     // Log out by clearing the authentication state
//     function logout() {
//         setUser(null);
//         setToken(null);
//     }

//     return (
//         <AuthContext.Provider value={{ user, token, login, register, logout }}>
//             {children}
//         </AuthContext.Provider>
//     );
// }

import { useState } from "react";

import { loginUser, registerUser } from "../api/authApi";
import { AuthContext } from "./AuthContext";

const AUTH_STORAGE_KEY = "business-analytics-auth";

// Read the authentication data saved in the current browser tab.
function readStoredAuth() {
    try {
        const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);

        if (!stored) {
            return null;
        }

        const auth = JSON.parse(stored);

        if (!auth?.user || !auth?.token) {
            return null;
        }

        return auth;
    } catch {
        return null;
    }
}

// Provide authentication state and functions to child components.
export function AuthProvider({ children }) {
    const [auth, setAuth] = useState(readStoredAuth);

    const user = auth?.user ?? null;
    const token = auth?.token ?? null;

    // Log in and save authentication for the current browser tab.
    async function login(email, password) {
        const data = await loginUser(email, password);

        const nextAuth = {
            user: data.user,
            token: data.token
        };

        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
        setAuth(nextAuth);
    }

    // Register and save authentication for the current browser tab.
    async function register(email, password) {
        const data = await registerUser(email, password);

        const nextAuth = {
            user: data.user,
            token: data.token
        };

        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
        setAuth(nextAuth);
    }

    // Log out and remove saved authentication data.
    function logout() {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        setAuth(null);
    }

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
