/** @import { AuthResponse, AuthUser } from "../types/apiTypes.js" */
import { apiRequest } from "./apiClient";

// POST /api/auth/register - Create a new user account.
/**
 * Register a new user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<AuthResponse>}
 */
export function registerUser(email, password) {
    return apiRequest("/auth/register", {
        method: "POST",
        body: { email, password }
    });
}

// POST /api/auth/login - Log in and receive a JWT.
/**
 * Log in and receive a JWT.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<AuthResponse>}
 */
export function loginUser(email, password) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: { email, password }
    });
}

// GET /api/auth/me - Get the current user using a JWT.
/**
 * Get the current user.
 * @param {string} token
 * @returns {Promise<AuthUser>}
 */
export function getCurrentUser(token) {
    return apiRequest("/auth/me", {
        token
    });
}
