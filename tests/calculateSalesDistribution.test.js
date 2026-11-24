import { describe, expect, it } from "vitest";
import { calculateSalesDistribution } from "./calculateSalesDistribution.js";

describe("calculateSalesDistribution", () => {
    it("counts each valid amount exactly once", () => {
        const rows = [
            { amount: "10.00" },
            { amount: "20.00" },
            { amount: "25.00" },
            { amount: "70.00" },
            { amount: "90.00" }
        ];

        const result = calculateSalesDistribution(rows, 5);

        expect(result.map((bin) => bin.count)).toEqual([3, 0, 0, 1, 1]);
    });

    it("handles identical amounts", () => {
        const rows = [{ amount: "50.00" }, { amount: "50.00" }];

        const result = calculateSalesDistribution(rows);

        expect(result).toHaveLength(1);
        expect(result[0].count).toBe(2);
    });

    it("preserves negative amounts", () => {
        const rows = [{ amount: "-20.00" }, { amount: "0" }, { amount: "20.00" }];

        const result = calculateSalesDistribution(rows);

        expect(result.reduce((total, bin) => total + bin.count, 0)).toBe(3);
    });

    it("returns an empty array for no records", () => {
        expect(calculateSalesDistribution([])).toEqual([]);
    });

    it("ignores missing amounts", () => {
        const rows = [{ amount: null }, { amount: "10.00" }, { amount: "20.00" }];

        const result = calculateSalesDistribution(rows);

        expect(result.reduce((total, bin) => total + bin.count, 0)).toBe(2);
    });
});
