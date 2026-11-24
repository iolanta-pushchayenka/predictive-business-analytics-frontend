import { describe, expect, it, vi } from "vitest";
import { calculateEda } from "../src/utils/calculateEda.js";

import { buildCorrelationAnalysis } from "../src/utils/buildCorrelationAnalysis.js";

// Replace data selectors with predictable test results.
vi.mock("../src/utils/buildAnalysisEligibility.js", () => ({
    selectAnalysisRows: vi.fn((result, operation) => ({
        status: "available",
        rows: result[operation] ?? []
    }))
}));

// Replace KPI calculations with known values.
vi.mock("../src/utils/calculateKpis.js", () => ({
    calculateTotalRevenue: vi.fn(() => "600.00"),
    calculateNumberOfOrders: vi.fn(() => 3),
    calculateAverageOrderValue: vi.fn(() => "200.00"),
    calculateUniqueCustomers: vi.fn(() => 2)
}));

vi.mock("../src/utils/calculateMonthlyKpiChanges.js", () => ({
    calculateMonthlyKpiChanges: vi.fn(() => ({
        changes: { totalSales: 10 }
    }))
}));

vi.mock("../src/utils/calculateMonthlySales.js", () => ({
    calculateMonthlySales: vi.fn(() => [{ month: "2026-01", sales: 600 }])
}));

vi.mock("../src/utils/calculateSalesByCategory.js", () => ({
    calculateSalesByCategory: vi.fn(() => [{ category: "Furniture", sales: 600 }])
}));

vi.mock("../src/utils/calculateSalesDistribution.js", () => ({
    calculateSalesDistribution: vi.fn(() => [{ range: "100–300", count: 3 }])
}));

vi.mock("../src/utils/buildCorrelationAnalysis.js", () => ({
    buildCorrelationAnalysis: vi.fn(() => ({
        status: "available",
        columns: ["Sales", "Profit"],
        matrix: []
    }))
}));

describe("calculateEda", () => {
    it("returns all analytics results", () => {
        const eda = calculateEda({
            result: {
                overallNetSales: [{ amount: "100" }],
                customerLinkedSales: [{ customerId: "C1" }],
                dailySalesTrends: [{ amount: "100" }],
                salesByCategory: [{ category: "Furniture" }]
            },
            mapping: {
                amount: "Sales",
                orderId: "Order ID"
            },
            columns: ["Sales", "Profit"],
            fullRows: [{ Sales: "100", Profit: "20" }]
        });

        expect(eda.totalRevenue).toBe("600.00");
        expect(eda.numberOfOrders).toBe(3);
        expect(eda.averageOrderValue).toBe("200.00");
        expect(eda.uniqueCustomers).toBe(2);
        expect(eda.monthlyChanges.changes.totalSales).toBe(10);
        expect(eda.monthlySales).toHaveLength(1);
        expect(eda.salesByCategory).toHaveLength(1);
        expect(eda.salesDistribution).toHaveLength(1);
        expect(eda.correlationAnalysis.status).toBe("available");

        expect(buildCorrelationAnalysis).toHaveBeenCalledWith({
            columns: ["Sales", "Profit"],
            rows: [{ Sales: "100", Profit: "20" }],
            mapping: {
                amount: "Sales",
                orderId: "Order ID"
            }
        });
    });

    it("rejects missing validated data or mapping", () => {
        expect(() =>
            calculateEda({
                result: null,
                mapping: null
            })
        ).toThrow("Validated dataset and column mapping are required.");
    });

    it("does not calculate order KPIs without Order ID mapping", () => {
        const eda = calculateEda({
            result: {
                overallNetSales: [],
                customerLinkedSales: [],
                dailySalesTrends: [],
                salesByCategory: []
            },
            mapping: {
                amount: "Sales"
            }
        });

        expect(eda.numberOfOrders).toBeNull();
        expect(eda.averageOrderValue).toBeNull();
    });
});
