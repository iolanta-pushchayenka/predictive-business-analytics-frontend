const API_URL = import.meta.env.VITE_API_URL;

// Shared function for registration and login POST requests
async function authRequest(endpoint, email, password) {
    const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
            data.error || "Authentication request failed"
        );
    }

    return response.json();
}


// POST /api/auth/register - Create a new user account
export function registerUser(email, password) {
    return authRequest("register", email, password);
}

// POST /api/auth/login - Log in and receive a JWT
export function loginUser(email, password) {
    return authRequest("login", email, password);
}

// GET /api/auth/me - Get the current user using a JWT
export async function getCurrentUser(token) {
    const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error("Failed to authenticate user");
    }

    return response.json();
}