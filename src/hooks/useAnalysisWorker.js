import { useCallback, useEffect, useRef, useState } from "react";

// Create a recognizable error for cancelled Worker tasks.
function createAbortError() {
    const error = new Error("Analysis task was cancelled.");
    error.name = "AbortError";
    return error;
}

// Manage a dedicated Worker and its asynchronous requests.
export function useAnalysisWorker() {
    const workerRef = useRef(null);
    const pendingRequestsRef = useRef(new Map());
    const nextRequestIdRef = useRef(0);
    const mountedRef = useRef(false);
    const initializationErrorRef = useRef(null);

    const [pendingCount, setPendingCount] = useState(0);
    const [error, setError] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [lastMetrics, setLastMetrics] = useState(null);

    // Reject every request that has not received a response.
    const rejectPendingRequests = useCallback((reason) => {
        for (const request of pendingRequestsRef.current.values()) {
            request.reject(reason);
        }

        pendingRequestsRef.current.clear();

        if (mountedRef.current) {
            setPendingCount(0);
        }
    }, []);

    // Create the Worker and connect its message handlers.
    const createWorker = useCallback(() => {
        const worker = new Worker(new URL("../workers/analysis.worker.js", import.meta.url), {
            type: "module"
        });

        workerRef.current = worker;

        // Match each Worker response to its original request.
        worker.onmessage = (event) => {
            if (workerRef.current !== worker) return;

            const { id, type, result, metrics, error: taskError } = event.data ?? {};

            const request = pendingRequestsRef.current.get(id);

            // Ignore cancelled, completed, or unknown requests.
            if (!request) return;

            pendingRequestsRef.current.delete(id);

            // Measure the complete request-response duration.
            const totalTimeMs = performance.now() - request.startTime;

            const taskMetrics = {
                ...metrics,
                totalTimeMs
            };

            if (mountedRef.current) {
                setPendingCount(pendingRequestsRef.current.size);
            }

            if (type === "SUCCESS") {
                if (mountedRef.current) {
                    setLastResult(result);
                    setLastMetrics(taskMetrics);
                    setError(null);
                }

                // Print performance metrics during development.
                if (import.meta.env.DEV) {
                    console.log(`[Web Worker] ${request.taskType}`, {
                        computationMs: taskMetrics.computationMs?.toFixed(2),
                        totalTimeMs: taskMetrics.totalTimeMs.toFixed(2)
                    });
                }

                request.resolve({
                    result,
                    metrics: taskMetrics
                });
            } else {
                const message = taskError?.message ?? "The Worker returned an invalid response.";

                const failure = new Error(message);

                if (mountedRef.current) {
                    setError(message);
                }

                request.reject(failure);
            }
        };

        // Handle failures that prevent the Worker from running.
        const handleWorkerFailure = (event) => {
            if (workerRef.current !== worker) return;

            const message = event?.message ?? "The analysis worker failed.";

            const failure = new Error(message);

            worker.terminate();
            workerRef.current = null;

            rejectPendingRequests(failure);

            if (mountedRef.current) {
                setError(message);
            }
        };

        worker.onerror = handleWorkerFailure;
        worker.onmessageerror = handleWorkerFailure;
    }, [rejectPendingRequests]);

    // Start the Worker when the hook mounts.
    useEffect(() => {
        mountedRef.current = true;

        try {
            createWorker();
        } catch (workerError) {
            initializationErrorRef.current = workerError.message;
        }

        // Stop the Worker and reject pending tasks on unmount.
        return () => {
            mountedRef.current = false;

            workerRef.current?.terminate();
            workerRef.current = null;

            rejectPendingRequests(createAbortError());
        };
    }, [createWorker, rejectPendingRequests]);

    // Send a task and return a Promise for its response.
    const runTask = useCallback((type, payload) => {
        return new Promise((resolve, reject) => {
            const worker = workerRef.current;

            if (!worker) {
                const message =
                    initializationErrorRef.current ?? "Analysis worker is not available.";

                setError(message);
                reject(new Error(message));
                return;
            }

            const id = ++nextRequestIdRef.current;

            // Store the task type and start time for performance measurement.
            pendingRequestsRef.current.set(id, {
                resolve,
                reject,
                taskType: type,
                startTime: performance.now()
            });

            setPendingCount(pendingRequestsRef.current.size);
            setError(null);

            try {
                worker.postMessage({
                    id,
                    type,
                    payload
                });
            } catch (sendError) {
                // Handle values that cannot be transferred to the Worker.
                pendingRequestsRef.current.delete(id);
                setPendingCount(pendingRequestsRef.current.size);
                setError(sendError.message);
                reject(sendError);
            }
        });
    }, []);

    // Cancel all active tasks and start a fresh Worker.
    const cancelAll = useCallback(() => {
        workerRef.current?.terminate();
        workerRef.current = null;

        rejectPendingRequests(createAbortError());

        setError(null);
        setLastResult(null);
        setLastMetrics(null);

        try {
            createWorker();
        } catch (workerError) {
            setError(workerError.message);
        }
    }, [createWorker, rejectPendingRequests]);

    return {
        runTask,
        cancelAll,
        loading: pendingCount > 0,
        pendingCount,
        error,
        lastResult,
        lastMetrics
    };
}
