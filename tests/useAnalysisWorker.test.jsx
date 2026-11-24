// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, renderHook } from "@testing-library/react";
import { useAnalysisWorker } from "../src/hooks/useAnalysisWorker.js";

let workers = [];

// Simulate the browser Web Worker API.
class MockWorker {
    constructor(url, options) {
        this.url = url;
        this.options = options;
        this.postMessage = vi.fn();
        this.terminate = vi.fn();
        this.onmessage = null;
        this.onerror = null;
        this.onmessageerror = null;

        workers.push(this);
    }

    // Simulate a message received from the Worker.
    sendResponse(data) {
        this.onmessage?.({ data });
    }
}

describe("useAnalysisWorker", () => {
    beforeEach(() => {
        workers = [];
        vi.stubGlobal("Worker", MockWorker);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates and terminates a Worker", () => {
        const { unmount } = renderHook(() => useAnalysisWorker());

        expect(workers).toHaveLength(1);
        expect(workers[0].options).toEqual({
            type: "module"
        });

        unmount();

        expect(workers[0].terminate).toHaveBeenCalledOnce();
    });

    it("sends a task and receives its result", async () => {
        const { result } = renderHook(() => useAnalysisWorker());

        let task;

        act(() => {
            task = result.current.runTask("CALCULATE_EDA", { mapping: { amount: "Sales" } });
        });

        expect(result.current.loading).toBe(true);
        expect(result.current.pendingCount).toBe(1);

        expect(workers[0].postMessage).toHaveBeenCalledWith({
            id: 1,
            type: "CALCULATE_EDA",
            payload: {
                mapping: { amount: "Sales" }
            }
        });

        act(() => {
            workers[0].sendResponse({
                id: 1,
                type: "SUCCESS",
                result: { totalRevenue: "600" },
                metrics: { computationMs: 12 }
            });
        });

        await expect(task).resolves.toEqual({
            result: { totalRevenue: "600" },
            metrics: {
                computationMs: 12,
                totalTimeMs: expect.any(Number)
            }
        });

        expect(result.current.loading).toBe(false);
        expect(result.current.pendingCount).toBe(0);
        expect(result.current.lastResult.totalRevenue).toBe("600");
        expect(result.current.lastMetrics.computationMs).toBe(12);
    });

    it("returns a task error without stopping the Worker", async () => {
        const { result } = renderHook(() => useAnalysisWorker());

        let task;

        act(() => {
            task = result.current.runTask("PARSE_FULL", {
                file: "invalid"
            });
        });

        const rejection = expect(task).rejects.toThrow("Invalid CSV file");

        act(() => {
            workers[0].sendResponse({
                id: 1,
                type: "ERROR",
                error: {
                    message: "Invalid CSV file"
                }
            });
        });

        await rejection;

        expect(result.current.error).toBe("Invalid CSV file");
        expect(result.current.loading).toBe(false);
        expect(workers[0].terminate).not.toHaveBeenCalled();
    });

    it("cancels tasks and creates a fresh Worker", async () => {
        const { result } = renderHook(() => useAnalysisWorker());

        let task;

        act(() => {
            task = result.current.runTask("PARSE_FULL", { file: "sales.csv" });
        });

        const rejection = expect(task).rejects.toMatchObject({
            name: "AbortError"
        });

        const oldWorker = workers[0];

        act(() => {
            result.current.cancelAll();
        });

        await rejection;

        expect(oldWorker.terminate).toHaveBeenCalledOnce();
        expect(workers).toHaveLength(2);
        expect(result.current.loading).toBe(false);

        // Responses from the old Worker must not affect the new one.
        act(() => {
            oldWorker.sendResponse({
                id: 1,
                type: "SUCCESS",
                result: { outdated: true }
            });
        });

        expect(result.current.lastResult).toBeNull();
    });

    it("matches responses to the correct request IDs", async () => {
        const { result } = renderHook(() => useAnalysisWorker());

        let firstTask;
        let secondTask;

        act(() => {
            firstTask = result.current.runTask("PARSE_PREVIEW", {
                file: "first.csv"
            });

            secondTask = result.current.runTask("PARSE_FULL", {
                file: "second.csv"
            });
        });

        expect(result.current.pendingCount).toBe(2);

        act(() => {
            workers[0].sendResponse({
                id: 2,
                type: "SUCCESS",
                result: { name: "second" }
            });
        });

        await expect(secondTask).resolves.toMatchObject({
            result: { name: "second" }
        });

        expect(result.current.pendingCount).toBe(1);

        act(() => {
            workers[0].sendResponse({
                id: 1,
                type: "SUCCESS",
                result: { name: "first" }
            });
        });

        await expect(firstTask).resolves.toMatchObject({
            result: { name: "first" }
        });

        expect(result.current.loading).toBe(false);
    });

    it("rejects pending tasks when the Worker crashes", async () => {
        const { result } = renderHook(() => useAnalysisWorker());

        let task;

        act(() => {
            task = result.current.runTask("CALCULATE_EDA", {});
        });

        const rejection = expect(task).rejects.toThrow("Worker crashed");

        act(() => {
            workers[0].onerror({
                message: "Worker crashed"
            });
        });

        await rejection;

        expect(workers[0].terminate).toHaveBeenCalledOnce();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Worker crashed");
    });
});
