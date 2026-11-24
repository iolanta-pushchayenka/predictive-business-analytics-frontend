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

import { useEffect, useRef, useState } from "react";

import { getCurrentUser, loginUser, registerUser } from "../api/authApi";
import { logError } from "../utils/logger";
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
    const [initializing, setInitializing] = useState(Boolean(auth));
    const validationRef = useRef(null);

    const user = auth?.user ?? null;
    const token = auth?.token ?? null;

    useEffect(() => {
        if (!initializing || !token) return;

        // Reuse the request when Strict Mode replays the effect.
        const validation = (validationRef.current ??= getCurrentUser(token));
        let active = true;

        async function validateSession() {
            try {
                await validation;
            } catch (error) {
                if (active && validationRef.current === validation && error?.status === 401) {
                    try {
                        sessionStorage.removeItem(AUTH_STORAGE_KEY);
                    } catch (storageError) {
                        logError("Auth storage", storageError);
                    }
                    setAuth(null);
                }
            } finally {
                if (active && validationRef.current === validation) {
                    validationRef.current = null;
                    setInitializing(false);
                }
            }
        }

        validateSession();

        return () => {
            active = false;
        };
    }, [initializing, token]);

    function updateAuth(nextAuth) {
        validationRef.current = null;
        setAuth(nextAuth);
        setInitializing(false);
    }

    // Log in and save authentication for the current browser tab.
    async function login(email, password) {
        const data = await loginUser(email, password);

        const nextAuth = {
            user: data.user,
            token: data.token
        };

        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
        updateAuth(nextAuth);
    }

    // Register and save authentication for the current browser tab.
    async function register(email, password) {
        const data = await registerUser(email, password);

        const nextAuth = {
            user: data.user,
            token: data.token
        };

        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth));
        updateAuth(nextAuth);
    }

    // Log out and remove saved authentication data.
    function logout() {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
        updateAuth(null);
    }

    return (
        <AuthContext.Provider value={{ user, token, initializing, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
