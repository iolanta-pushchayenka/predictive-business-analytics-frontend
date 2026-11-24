import { describe, expect, it, vi } from "vitest";
import { calculateEda } from "../src/utils/calculateEda.js";

// Create a simulated Worker using real analysis functions.
async function createTestWorker() {
    const workerScope = {
        postMessage: vi.fn(),
        onmessage: null
    };

    vi.stubGlobal("self", workerScope);

    await import("../src/workers/analysis.worker.js");

    return workerScope;
}

// Send a task and retrieve the Worker's response.
async function runTask(worker, id, type, payload) {
    worker.postMessage.mockClear();

    await worker.onmessage({
        data: { id, type, payload }
    });

    expect(worker.postMessage).toHaveBeenCalledTimes(1);

    const response = worker.postMessage.mock.calls[0][0];

    expect(response.id).toBe(id);

    if (response.type === "ERROR") {
        throw new Error(`${type} failed: ${response.error.message}`);
    }

    expect(response.type).toBe("SUCCESS");
    expect(response.metrics.computationMs).toBeGreaterThanOrEqual(0);

    return response.result;
}

describe("analysis.worker integration", () => {
    it("processes a CSV and calculates real EDA results", async () => {
        vi.resetModules();

        const worker = await createTestWorker();

        try {
            // Use real CSV data, including two numeric columns
            // for correlation analysis.
            const csv = [
                "Date,Sales,Quantity,Profit,Order ID,Customer ID,Category",
                "01/01/2026,100,2,20,O1,C1,Furniture",
                "02/01/2026,200,4,50,O2,C2,Technology",
                "03/01/2026,150,3,30,O3,C1,Furniture",
                "01/02/2026,300,5,80,O4,C3,Technology",
                "02/02/2026,250,4,60,O5,C2,Furniture",
                "03/02/2026,400,7,120,O6,C4,Technology"
            ].join("\n");

            // Step 1: Parse the CSV using the real parser.
            const parsed = await runTask(worker, 1, "PARSE_FULL", { file: csv });

            expect(parsed.columns).toHaveLength(7);
            expect(parsed.rows).toHaveLength(6);

            const mapping = {
                date: "Date",
                amount: "Sales",
                orderId: "Order ID",
                customerId: "Customer ID",
                category: "Category"
            };

            // Use the format identifiers accepted by
            // the application's validation utilities.
            const formats = {
                date: "DMY_SLASH",
                amount: "dot",
                twoDigitYearCentury: 2000
            };

            // Step 2: Validate and prepare real records.
            const validationResult = await runTask(worker, 2, "VALIDATE_DATASET", {
                rows: parsed.rows,
                columns: parsed.columns,
                mapping,
                formats
            });

            expect(validationResult.report.totalRows).toBe(6);

            // Step 3: Calculate EDA using the real algorithms.
            const payload = {
                result: validationResult,
                mapping,
                columns: parsed.columns,
                fullRows: parsed.rows
            };

            const eda = await runTask(worker, 3, "CALCULATE_EDA", payload);

            // Compare Worker results with the shared algorithm.
            const expected = calculateEda(payload);

            expect(eda).toEqual(expected);

            // Verify all dashboard result fields are present.
            expect(eda).toHaveProperty("totalRevenue");
            expect(eda).toHaveProperty("numberOfOrders");
            expect(eda).toHaveProperty("averageOrderValue");
            expect(eda).toHaveProperty("uniqueCustomers");
            expect(eda).toHaveProperty("monthlyChanges");
            expect(eda).toHaveProperty("monthlySales");
            expect(eda).toHaveProperty("salesByCategory");
            expect(eda).toHaveProperty("salesDistribution");
            expect(eda).toHaveProperty("correlationAnalysis");

            expect(eda.totalRevenue).not.toBeNull();
            expect(eda.numberOfOrders).toBe(6);
            expect(eda.uniqueCustomers).toBe(4);
            expect(eda.monthlySales.length).toBeGreaterThan(0);
            expect(eda.salesByCategory.length).toBeGreaterThan(0);
        } finally {
            vi.unstubAllGlobals();
            vi.resetModules();
        }
    });
});
