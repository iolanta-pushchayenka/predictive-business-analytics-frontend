import { describe, expect, it } from "vitest";
import { analyzeAmountOutliers } from "../src/utils/analyzeAmountOutliers.js";

function makeRows(amounts) {
    return amounts.map((amount, index) => ({
        recordNumber: index + 1,
        amount,
        amountStatus: "valid"
    }));
}

describe("analyzeAmountOutliers", () => {
    it("requires 20 eligible amounts and excludes other amount statuses", () => {
        const rows = [
            ...makeRows(Array(19).fill("0")),
            { recordNumber: 20, amount: "-5", amountStatus: "negative" },
            { recordNumber: 21, amount: null, amountStatus: "missing" },
            { recordNumber: 22, amount: null, amountStatus: "invalid" }
        ];

        expect(analyzeAmountOutliers(rows)).toEqual({
            diagnostics: {
                status: "unavailable",
                reason: "insufficient_sample",
                eligibleCount: 19,
                q1: null,
                q3: null,
                iqr: null,
                upperThreshold: null
            },
            outlierRecordNumbers: []
        });
    });

    it("uses R-7 interpolation and keeps the fractional threshold exact", () => {
        const rows = makeRows([
            ...Array(6).fill("0"),
            ...Array(9).fill("0.000001"),
            ...Array(4).fill("0.000002"),
            "0.000004"
        ]);

        expect(analyzeAmountOutliers(rows)).toEqual({
            diagnostics: {
                status: "available",
                reason: null,
                eligibleCount: 20,
                q1: "0",
                q3: "0.00000125",
                iqr: "0.00000125",
                upperThreshold: "0.000003125"
            },
            outlierRecordNumbers: [20]
        });
    });

    it("flags only amounts strictly above the threshold", () => {
        const rows = makeRows([...Array(6).fill("0"), ...Array(12).fill("2"), "5", "5.000001"]);

        const result = analyzeAmountOutliers(rows);

        expect(result.diagnostics.upperThreshold).toBe("5");
        expect(result.outlierRecordNumbers).toEqual([20]);
    });

    it("returns an unavailable status for zero IQR even with a large amount", () => {
        const rows = makeRows([...Array(19).fill("2"), "10000"]);

        expect(analyzeAmountOutliers(rows)).toEqual({
            diagnostics: {
                status: "unavailable",
                reason: "zero_iqr",
                eligibleCount: 20,
                q1: "2",
                q3: "2",
                iqr: "0",
                upperThreshold: null
            },
            outlierRecordNumbers: []
        });
    });

    it("distinguishes one millionth near the maximum accepted amount", () => {
        const rows = makeRows([
            ...Array(6).fill("999999999994"),
            ...Array(12).fill("999999999996"),
            "999999999999",
            "999999999999.000001"
        ]);

        const result = analyzeAmountOutliers(rows);

        expect(result.diagnostics.upperThreshold).toBe("999999999999");
        expect(result.outlierRecordNumbers).toEqual([20]);
        expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    });

    it("keeps quartiles independent of input order and preserves record references", () => {
        const rows = makeRows([...Array(6).fill("0"), ...Array(12).fill("2"), "8", "9"]);
        const reversed = Object.freeze([...rows].reverse().map(Object.freeze));
        const forwardResult = analyzeAmountOutliers(rows);
        const reversedResult = analyzeAmountOutliers(reversed);

        expect(reversedResult.diagnostics).toEqual(forwardResult.diagnostics);
        expect(forwardResult.outlierRecordNumbers).toEqual([19, 20]);
        expect(reversedResult.outlierRecordNumbers).toEqual([20, 19]);
        expect(reversed.map(({ recordNumber }) => recordNumber)).toEqual(
            Array.from({ length: 20 }, (_, index) => 20 - index)
        );
    });
});
