import { describe, expect, it } from "vitest";
import { buildCorrelationAnalysis } from "../src/utils/buildCorrelationAnalysis.js";

describe("buildCorrelationAnalysis", () => {
    it("detects numeric columns and calculates correlations", () => {
        const columns = ["Row ID", "Order Date", "Sales", "Quantity", "Profit", "Category"];

        const rows = [
            {
                "Row ID": "1",
                "Order Date": "2024-01-01",
                Sales: "100",
                Quantity: "1",
                Profit: "10",
                Category: "A"
            },
            {
                "Row ID": "2",
                "Order Date": "2024-01-02",
                Sales: "200",
                Quantity: "2",
                Profit: "20",
                Category: "B"
            },
            {
                "Row ID": "3",
                "Order Date": "2024-01-03",
                Sales: "300",
                Quantity: "3",
                Profit: "30",
                Category: "A"
            },
            {
                "Row ID": "4",
                "Order Date": "2024-01-04",
                Sales: "400",
                Quantity: "4",
                Profit: "40",
                Category: "B"
            }
        ];

        const result = buildCorrelationAnalysis({
            columns,
            rows,
            mapping: {
                date: "Order Date",
                amount: "Sales",
                category: "Category"
            }
        });

        expect(result.status).toBe("available");

        expect(result.columns).toEqual(["Sales", "Quantity", "Profit"]);

        expect(result.matrix[0][1].value).toBeCloseTo(1);
        expect(result.matrix[0][2].value).toBeCloseTo(1);
        expect(result.matrix[0][1].pairCount).toBe(4);
    });

    it("returns unavailable when fewer than two numeric columns exist", () => {
        const result = buildCorrelationAnalysis({
            columns: ["Sales", "Region"],
            rows: [
                { Sales: "100", Region: "East" },
                { Sales: "200", Region: "West" },
                { Sales: "300", Region: "East" }
            ]
        });

        expect(result.status).toBe("unavailable");
        expect(result.reason).toBe("insufficient_numeric_columns");
    });

    it("uses European number formatting", () => {
        const result = buildCorrelationAnalysis({
            columns: ["Revenue", "Expenses"],
            rows: [
                { Revenue: "1.000,50", Expenses: "100,50" },
                { Revenue: "2.000,50", Expenses: "200,50" },
                { Revenue: "3.000,50", Expenses: "300,50" }
            ],
            numberFormat: {
                decimalSeparator: ",",
                thousandsSeparator: "."
            }
        });

        expect(result.status).toBe("available");
        expect(result.matrix[0][1].value).toBeCloseTo(1);
    });

    it("reports unavailable when valid numeric pairs are insufficient", () => {
        const result = buildCorrelationAnalysis({
            columns: ["Sales", "Profit"],
            rows: [
                { Sales: "100", Profit: "" },
                { Sales: "200", Profit: "" },
                { Sales: "300", Profit: "" },
                { Sales: "", Profit: "10" },
                { Sales: "", Profit: "20" },
                { Sales: "", Profit: "30" }
            ]
        });

        expect(result.columns).toEqual(["Sales", "Profit"]);
        expect(result.status).toBe("unavailable");
        expect(result.reason).toBe("insufficient_valid_pairs");

        expect(result.stats.Sales.valid).toBe(3);
        expect(result.stats.Profit.valid).toBe(3);

        expect(result.matrix[0][1].pairCount).toBe(0);
        expect(result.matrix[0][1].value).toBeNull();
    });
});
