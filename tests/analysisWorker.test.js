import { beforeEach, describe, expect, it, vi } from "vitest";

import { parseCsv } from "../src/utils/parseCsv.js";
import { profileDataset } from "../src/utils/profileDataset.js";
import { validateMapping, validateDataset } from "../src/utils/validateDataset.js";
import { calculateEda } from "../src/utils/calculateEda.js";

// Mock existing algorithms to test Worker task routing.
vi.mock("../src/utils/parseCsv.js", () => ({
    parseCsv: vi.fn()
}));

vi.mock("../src/utils/profileDataset.js", () => ({
    profileDataset: vi.fn()
}));

vi.mock("../src/utils/validateDataset.js", () => ({
    validateMapping: vi.fn(),
    validateDataset: vi.fn()
}));

vi.mock("../src/utils/calculateEda.js", () => ({
    calculateEda: vi.fn()
}));

// Initialize the Worker handler in a simulated environment.
async function createTestWorker() {
    const workerScope = {
        postMessage: vi.fn(),
        onmessage: null
    };

    vi.stubGlobal("self", workerScope);

    await import("../src/workers/analysis.worker.js");

    return workerScope;
}

// Check the standard successful Worker response.
function expectSuccess(worker, id, result) {
    expect(worker.postMessage).toHaveBeenCalledWith({
        id,
        type: "SUCCESS",
        result,
        metrics: {
            computationMs: expect.any(Number)
        }
    });
}

// Check the standard Worker error response.
function expectError(worker, id, message) {
    expect(worker.postMessage).toHaveBeenCalledWith({
        id,
        type: "ERROR",
        error: { message }
    });
}

describe("analysis.worker", () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it("returns EDA results for a valid task", async () => {
        const worker = await createTestWorker();

        const payload = {
            result: { rows: [] },
            mapping: { amount: "Sales" }
        };

        const expectedResult = {
            totalRevenue: "600.00",
            monthlySales: []
        };

        vi.mocked(calculateEda).mockReturnValue(expectedResult);

        await worker.onmessage({
            data: {
                id: 1,
                type: "CALCULATE_EDA",
                payload
            }
        });

        expect(calculateEda).toHaveBeenCalledWith(payload);
        expectSuccess(worker, 1, expectedResult);
    });

    it("rejects unknown task types", async () => {
        const worker = await createTestWorker();

        await worker.onmessage({
            data: {
                id: 2,
                type: "UNKNOWN_TASK"
            }
        });

        expect(calculateEda).not.toHaveBeenCalled();
        expect(parseCsv).not.toHaveBeenCalled();
        expectError(worker, 2, "Unknown analysis task: UNKNOWN_TASK");
    });

    it("reports calculation errors", async () => {
        const worker = await createTestWorker();

        vi.mocked(calculateEda).mockImplementation(() => {
            throw new Error("Invalid analysis data");
        });

        await worker.onmessage({
            data: {
                id: 3,
                type: "CALCULATE_EDA",
                payload: {}
            }
        });

        expectError(worker, 3, "Invalid analysis data");
    });

    it("parses the first five CSV rows for preview", async () => {
        const worker = await createTestWorker();

        const file = { name: "sales.csv" };

        const expectedResult = {
            columns: ["Date", "Sales"],
            rows: [{ Date: "2026-01-01", Sales: "100" }]
        };

        vi.mocked(parseCsv).mockResolvedValue(expectedResult);

        await worker.onmessage({
            data: {
                id: 4,
                type: "PARSE_PREVIEW",
                payload: { file }
            }
        });

        expect(parseCsv).toHaveBeenCalledWith(file, { previewRows: 5 });

        expectSuccess(worker, 4, expectedResult);
    });

    it("parses the complete CSV dataset", async () => {
        const worker = await createTestWorker();

        const file = { name: "sales.csv" };

        const expectedResult = {
            columns: ["Date", "Sales"],
            rows: [
                { Date: "2026-01-01", Sales: "100" },
                { Date: "2026-01-02", Sales: "200" }
            ]
        };

        vi.mocked(parseCsv).mockResolvedValue(expectedResult);

        await worker.onmessage({
            data: {
                id: 5,
                type: "PARSE_FULL",
                payload: { file }
            }
        });

        expect(parseCsv).toHaveBeenCalledWith(file);
        expectSuccess(worker, 5, expectedResult);
    });

    it("reports CSV parsing errors", async () => {
        const worker = await createTestWorker();

        vi.mocked(parseCsv).mockRejectedValue(new Error('Duplicate CSV header: "Sales".'));

        await worker.onmessage({
            data: {
                id: 6,
                type: "PARSE_FULL",
                payload: {
                    file: { name: "invalid.csv" }
                }
            }
        });

        expectError(worker, 6, 'Duplicate CSV header: "Sales".');
    });

    it("validates mapping and profiles the dataset", async () => {
        const worker = await createTestWorker();

        const payload = {
            rows: [{ Date: "2026-01-01", Sales: "100" }],
            columns: ["Date", "Sales"],
            mapping: {
                date: "Date",
                amount: "Sales"
            }
        };

        const expectedProfile = {
            totalRows: 1,
            sampleSize: 1
        };

        vi.mocked(profileDataset).mockReturnValue(expectedProfile);

        await worker.onmessage({
            data: {
                id: 7,
                type: "PROFILE_DATASET",
                payload
            }
        });

        expect(validateMapping).toHaveBeenCalledWith(payload.columns, payload.mapping);

        expect(profileDataset).toHaveBeenCalledWith(payload.rows, payload.columns, payload.mapping);

        expectSuccess(worker, 7, expectedProfile);
    });

    it("rejects invalid mapping before profiling", async () => {
        const worker = await createTestWorker();

        vi.mocked(validateMapping).mockImplementation(() => {
            throw new Error("Invalid column mapping");
        });

        await worker.onmessage({
            data: {
                id: 8,
                type: "PROFILE_DATASET",
                payload: {
                    rows: [],
                    columns: ["Date", "Sales"],
                    mapping: {}
                }
            }
        });

        expect(profileDataset).not.toHaveBeenCalled();
        expectError(worker, 8, "Invalid column mapping");
    });

    it("validates and prepares the dataset", async () => {
        const worker = await createTestWorker();

        const payload = {
            rows: [{ Date: "2026-01-01", Sales: "100" }],
            columns: ["Date", "Sales"],
            mapping: {
                date: "Date",
                amount: "Sales"
            },
            formats: {
                date: "YYYY-MM-DD",
                amount: "1234.56",
                twoDigitYearCentury: 2000
            }
        };

        const expectedResult = {
            report: {
                totalRows: 1
            },
            normalizedRows: []
        };

        vi.mocked(validateDataset).mockReturnValue(expectedResult);

        await worker.onmessage({
            data: {
                id: 9,
                type: "VALIDATE_DATASET",
                payload
            }
        });

        expect(validateDataset).toHaveBeenCalledWith(
            payload.rows,
            payload.columns,
            payload.mapping,
            payload.formats
        );

        expectSuccess(worker, 9, expectedResult);
    });

    it("reports dataset validation errors", async () => {
        const worker = await createTestWorker();

        vi.mocked(validateDataset).mockImplementation(() => {
            throw new Error("Dataset validation failed");
        });

        await worker.onmessage({
            data: {
                id: 10,
                type: "VALIDATE_DATASET",
                payload: {
                    rows: [],
                    columns: [],
                    mapping: {},
                    formats: {}
                }
            }
        });

        expectError(worker, 10, "Dataset validation failed");
    });
});
