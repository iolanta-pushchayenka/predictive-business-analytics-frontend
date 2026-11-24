import { logError } from "../utils/logger";
const API_URL = import.meta.env.VITE_API_URL;

const httpErrorMessages = {
    400: "Check the information you entered and try again.",
    401: "Authentication required or invalid credentials.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "The request conflicts with existing data.",
    500: "A server error occurred. Please try again later."
};

const userFacingApiErrors = {
    400: ["Invalid login data", "Invalid registration data"],
    401: [
        "Invalid email or password",
        "Authentication token is required",
        "Invalid authentication token",
        "Invalid or expired authentication token",
        "User no longer exists"
    ],
    409: ["Email is already registered"]
};

// Represent an API error with its HTTP status.
export class ApiError extends Error {
    constructor(message, status) {
        super(message);

        this.name = "ApiError";
        this.status = status;
    }
}

// Send an HTTP request and handle API, network and timeout errors.
export async function apiRequest(endpoint, options = {}) {
    const { method = "GET", body, token } = options;

    const headers = {};

    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Cancel requests that take longer than 90 seconds.
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, 90000);

    try {
        // Send the request to the backend.
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: controller.signal
        });

        // Parse the response if it contains JSON.
        const text = await response.text();

        let data = null;

        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = null;
            }
        }

        // Handle HTTP errors.
        if (!response.ok) {
            const { status } = response;
            const fallback = httpErrorMessages[status >= 500 ? 500 : status];
            const message = userFacingApiErrors[status]?.includes(data?.error)
                ? data.error
                : fallback ?? "The request failed. Please try again.";

            throw new ApiError(message, status);
        }

        return data;
    } catch (error) {
        // Log HTTP errors and preserve their status.
        if (error instanceof ApiError) {
            logError("API", error);
            throw error;
        }

        // Handle timeout errors.
        if (controller.signal.aborted) {
            const timeoutError = new ApiError(
                "The server is taking too long to respond. Please try again.",
                0
            );

            logError("API", timeoutError);
            throw timeoutError;
        }

        // Handle network errors.
        const networkError = new ApiError(
            "Unable to connect to the server. Check your internet connection.",
            0
        );

        logError("API", networkError);
        throw networkError;
    } finally {
        // Always clear the timeout.
        clearTimeout(timeoutId);
    }
}
