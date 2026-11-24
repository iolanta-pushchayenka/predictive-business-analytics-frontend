import { describe, expect, it, vi } from "vitest";
import { analyzeAmountOutliers } from "../src/utils/analyzeAmountOutliers.js";
import { selectAnalysisRows } from "../src/utils/buildAnalysisEligibility.js";
import { checkPreparedDatasetIntegrity } from "../src/utils/checkPreparedDatasetIntegrity.js";
import { validateDataset } from "../src/utils/validateDataset.js";

vi.mock("../src/utils/analyzeAmountOutliers.js", { spy: true });

const columns = ["day", "total", "customer", "order"];
const mapping = { date: "day", amount: "total", customerId: "customer", orderId: "order" };
const formats = { date: "YMD_DASH", amount: "dot" };

const sourceRows = Object.freeze([
    Object.freeze({ day: "2026-11-01", total: "012.500", customer: " 001 ", order: "A" }),
    Object.freeze({ day: "2026-11-01", total: "12.5", customer: "001", order: "A" }),
    Object.freeze({ day: "bad date", total: "-2", customer: "", order: "A" }),
    Object.freeze({ day: "2026-11-02", total: "", customer: "002", order: "" })
]);

const outlierRows = [...Array(6).fill("0"), ...Array(12).fill("2"), "5", "5.000001"].map(
    (total) => ({ day: "2026-11-01", total, customer: "001", order: "A" })
);

function prepare(rows = sourceRows) {
    return validateDataset(rows, columns, mapping, formats);
}

function expectViolation(rows, result, code) {
    const integrity = checkPreparedDatasetIntegrity(rows, mapping, result);

    expect(integrity.status).toBe("failed");
    expect(integrity.violations).toContainEqual(expect.objectContaining({ code }));
}

describe("checkPreparedDatasetIntegrity", () => {
    it("passes when source errors are correctly represented", () => {
        const result = prepare();

        expect(result.issues.map(({ code }) => code)).toEqual(
            expect.arrayContaining(["INVALID_DATE", "MISSING_AMOUNT"])
        );
        expect(result.integrity).toEqual({ status: "passed", violations: [] });
    });

    it.each([
        ["row count", (r) => r.preparedRows.pop(), "ROW_COUNT_MISMATCH"],
        [
            "record number",
            (r) => {
                r.preparedRows[1].recordNumber = 1;
            },
            "RECORD_NUMBER_MISMATCH"
        ],
        [
            "canonical amount",
            (r) => {
                r.preparedRows[0].amount = "12.50";
            },
            "NON_CANONICAL_AMOUNT"
        ],
        [
            "amount status",
            (r) => {
                r.preparedRows[2].amountStatus = "valid";
            },
            "NON_CANONICAL_AMOUNT"
        ],
        [
            "calendar date",
            (r) => {
                r.preparedRows[0].date = "2026-02-30";
            },
            "NON_CANONICAL_DATE"
        ],
        [
            "customer ID",
            (r) => {
                r.preparedRows[0].customerId = "1";
            },
            "OPTIONAL_VALUE_MISMATCH"
        ],
        [
            "sales flag",
            (r) => {
                r.preparedRows[0].validForSales = false;
            },
            "VALID_FOR_SALES_MISMATCH"
        ],
        [
            "report counter",
            (r) => {
                r.report.zeroAmounts++;
            },
            "REPORT_COUNTER_MISMATCH"
        ],
        [
            "eligibility",
            (r) => r.analysisEligibility.overallNetSales.eligibleRecordNumbers.pop(),
            "ELIGIBILITY_MISMATCH"
        ],
        ["duplicate issue", (r) => r.issues.push({ ...r.issues[0] }), "ISSUE_MISMATCH"],
        [
            "missing match warning",
            (r) => {
                r.issues = r.issues.filter(({ code }) => code !== "POSSIBLE_DUPLICATE");
            },
            "ISSUE_MISMATCH"
        ],
        [
            "issue severity",
            (r) => {
                r.issues[0].severity = "warning";
            },
            "ISSUE_MISMATCH"
        ],
        [
            "issue field",
            (r) => {
                r.issues[0].field = "amount";
            },
            "ISSUE_MISMATCH"
        ],
        [
            "issue record number",
            (r) => {
                r.issues[0].recordNumber = 999;
            },
            "ISSUE_MISMATCH"
        ]
    ])("detects a changed %s", (_name, change, code) => {
        const result = prepare();
        change(result);

        expectViolation(sourceRows, result, code);
    });

    it("calculates IQR once during preparation and never during an integrity recheck", () => {
        vi.mocked(analyzeAmountOutliers).mockClear();
        const result = prepare(outlierRows);

        expect(result.outlierAnalysis.upperThreshold).toBe("5");
        expect(result.integrity).toEqual({ status: "passed", violations: [] });
        expect(checkPreparedDatasetIntegrity(outlierRows, mapping, result).status).toBe("passed");
        expect(analyzeAmountOutliers).toHaveBeenCalledTimes(1);
    });

    it("rejects a threshold that contradicts the saved quartiles", () => {
        const result = prepare(outlierRows);
        result.outlierAnalysis.upperThreshold = "6";

        expectViolation(outlierRows, result, "OUTLIER_ANALYSIS_MISMATCH");
    });

    it.each(["remove", "move to threshold"])("rejects an altered outlier warning: %s", (change) => {
        const result = prepare(outlierRows);

        if (change === "remove") {
            result.issues = result.issues.filter(({ code }) => code !== "HIGH_VALUE_OUTLIER");
        } else {
            result.issues.find(({ code }) => code === "HIGH_VALUE_OUTLIER").recordNumber = 19;
        }

        expectViolation(outlierRows, result, "ISSUE_MISMATCH");
    });

    it("rejects an incorrect outlier counter", () => {
        const result = prepare(outlierRows);
        result.report.highValueOutlierCount++;

        expectViolation(outlierRows, result, "REPORT_COUNTER_MISMATCH");
    });

    it("blocks analytics after a failed integrity check", () => {
        const result = prepare();
        result.report.validSalesRows++;

        const integrity = checkPreparedDatasetIntegrity(sourceRows, mapping, result);

        expect(integrity.violations).toContainEqual({
            code: "REPORT_COUNTER_MISMATCH",
            recordNumber: null,
            field: "validSalesRows"
        });
        expect(selectAnalysisRows({ ...result, integrity }, "overallNetSales")).toEqual({
            status: "blocked",
            reason: "integrity_not_passed",
            rows: []
        });
    });
});
