// @vitest-environment jsdom

import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "../src/api/apiClient.js";
import ProtectedRoute from "../src/components/ProtectedRoute.jsx";
import { AuthProvider } from "../src/context/AuthProvider.jsx";
import { useAuth } from "../src/hooks/useAuth.js";

const storageKey = "business-analytics-auth";
const restoredAuth = { user: { id: "1", email: "saved@example.com" }, token: "restored-token" };
const freshAuth = { user: { id: "2", email: "new@example.com" }, token: "fresh-token" };
const fetchMock = vi.fn();

function apiResponse(status, data) {
    return new Response(JSON.stringify(data), { status });
}

function AuthActions() {
    const { login, register, logout } = useAuth();
    return (
        <>
            <button onClick={() => login(freshAuth.user.email, "password")}>Log in</button>
            <button onClick={() => register(freshAuth.user.email, "password")}>Register</button>
            <button onClick={logout}>Log out</button>
        </>
    );
}

function renderProtectedRoute() {
    render(
        <StrictMode>
            <MemoryRouter initialEntries={["/private"]}>
                <AuthProvider>
                    <AuthActions />
                    <Routes>
                        <Route element={<ProtectedRoute />}>
                            <Route path="/private" element={<h1>Private page</h1>} />
                        </Route>
                        <Route path="/login" element={<h1>Login page</h1>} />
                    </Routes>
                </AuthProvider>
            </MemoryRouter>
        </StrictMode>
    );
}

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("API error messages", () => {
    it.each([
        [400, "Invalid registration data"],
        [401, "Invalid email or password"],
        [409, "Email is already registered"]
    ])("preserves known user-facing errors for HTTP %i", async (status, message) => {
        fetchMock.mockResolvedValue(apiResponse(status, { error: message }));

        const request = apiRequest("/auth/register");
        await expect(request).rejects.toBeInstanceOf(ApiError);
        await expect(request).rejects.toMatchObject({ status, message });
    });

    it.each([
        [400, "Check the information you entered and try again."],
        [401, "Authentication required or invalid credentials."],
        [403, "You do not have permission to perform this action."],
        [404, "The requested resource was not found."],
        [500, "A server error occurred. Please try again later."],
        [503, "A server error occurred. Please try again later."]
    ])("replaces unexpected backend messages for HTTP %i", async (status, message) => {
        fetchMock.mockResolvedValue(apiResponse(status, { error: "Database driver stack trace" }));

        await expect(apiRequest("/auth/login")).rejects.toMatchObject({ status, message });
    });
});

describe("restored authentication", () => {
    beforeEach(() => {
        sessionStorage.setItem(storageKey, JSON.stringify(restoredAuth));
    });

    it("holds protected routes until the stored token is validated", async () => {
        const pending = Promise.withResolvers();
        fetchMock.mockReturnValue(pending.promise);
        renderProtectedRoute();

        expect(screen.getByRole("status").textContent).toBe("Checking your session...");
        expect(screen.queryByRole("heading")).toBeNull();
        expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
            expect.stringMatching(/\/auth\/me$/),
            expect.objectContaining({
                method: "GET",
                headers: { Authorization: "Bearer restored-token" }
            })
        );

        pending.resolve(apiResponse(200, restoredAuth.user));
        await screen.findByRole("heading", { name: "Private page" });
        expect(screen.queryByRole("status")).toBeNull();
    });

    it("removes a session rejected with 401 and redirects to login", async () => {
        fetchMock.mockResolvedValue(apiResponse(401, { error: "Invalid or expired authentication token" }));
        renderProtectedRoute();

        await screen.findByRole("heading", { name: "Login page" });
        expect(sessionStorage.getItem(storageKey)).toBeNull();
    });

    it.each(["network", "server"])("keeps credentials after a temporary %s failure", async (failure) => {
        if (failure === "network") {
            fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
        } else {
            fetchMock.mockResolvedValue(apiResponse(503, {}));
        }

        renderProtectedRoute();

        await screen.findByRole("heading", { name: "Private page" });
        expect(sessionStorage.getItem(storageKey)).toBe(JSON.stringify(restoredAuth));
    });

    it.each(["Log in", "Register"])("keeps a new session after a stale 401 during %s", async (label) => {
        const pending = Promise.withResolvers();
        fetchMock.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(apiResponse(200, freshAuth));
        renderProtectedRoute();

        fireEvent.click(screen.getByRole("button", { name: label }));
        await screen.findByRole("heading", { name: "Private page" });
        await act(async () => {
            pending.resolve(apiResponse(401, {}));
        });

        expect(sessionStorage.getItem(storageKey)).toBe(JSON.stringify(freshAuth));
        expect(screen.getByRole("heading", { name: "Private page" })).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Log out" }));
        await screen.findByRole("heading", { name: "Login page" });
        expect(sessionStorage.getItem(storageKey)).toBeNull();
    });
});
