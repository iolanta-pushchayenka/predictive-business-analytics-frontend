import { describe, expect, it } from "vitest";
import {
    buildAnalysisEligibility,
    selectAnalysisRows
} from "../src/utils/buildAnalysisEligibility.js";

const mapping = { date: "day", amount: "total", category: "group", customerId: "customer" };

const rows = [
    {
        recordNumber: 1,
        dateStatus: "valid",
        amountStatus: "valid",
        amount: "0",
        category: "Books",
        customerId: "001"
    },
    {
        recordNumber: 2,
        dateStatus: "invalid",
        amountStatus: "negative",
        amount: "-25",
        category: "Books",
        customerId: "001"
    },
    {
        recordNumber: 3,
        dateStatus: "valid",
        amountStatus: "valid",
        amount: "10",
        category: null,
        customerId: null
    },
    {
        recordNumber: 4,
        dateStatus: "missing",
        amountStatus: "missing",
        amount: null,
        category: null,
        customerId: null
    },
    {
        recordNumber: 5,
        dateStatus: "valid",
        amountStatus: "invalid",
        amount: null,
        category: "Books",
        customerId: "001"
    }
];

describe("buildAnalysisEligibility", () => {
    it("applies the five operation rules independently", () => {
        const result = buildAnalysisEligibility(rows, mapping);
        const expected = {
            overallNetSales: [1, 2, 3],
            dailySalesTrends: [1, 3],
            salesByCategory: [1, 2],
            customerLinkedSales: [1, 2],
            customerSalesByDate: [1]
        };

        for (const [operation, recordNumbers] of Object.entries(expected)) {
            expect(result[operation]).toMatchObject({
                status: "available",
                eligibleCount: recordNumbers.length,
                excludedCount: rows.length - recordNumbers.length,
                eligibleRecordNumbers: recordNumbers
            });
        }

        expect(result.overallNetSales.excludedRecords).toEqual([
            { recordNumber: 4, reasons: ["MISSING_AMOUNT"] },
            { recordNumber: 5, reasons: ["INVALID_AMOUNT"] }
        ]);
        expect(result.dailySalesTrends.excludedRecords).toContainEqual({
            recordNumber: 2,
            reasons: ["INVALID_DATE"]
        });
        expect(result.salesByCategory.excludedRecords).toContainEqual({
            recordNumber: 3,
            reasons: ["MISSING_CATEGORY"]
        });
        expect(result.customerSalesByDate.excludedRecords).toContainEqual({
            recordNumber: 4,
            reasons: ["MISSING_AMOUNT", "MISSING_DATE", "MISSING_CUSTOMER_ID"]
        });
    });

    it("distinguishes an unmapped column from a mapped column with missing values", () => {
        const mapped = buildAnalysisEligibility([rows[2]], mapping);
        const unmapped = buildAnalysisEligibility([rows[2]], { date: "day", amount: "total" });

        expect(mapped.salesByCategory).toMatchObject({
            status: "unavailable",
            reason: "no_eligible_records",
            excludedRecords: [{ recordNumber: 3, reasons: ["MISSING_CATEGORY"] }]
        });
        expect(unmapped.salesByCategory).toEqual({
            status: "unavailable",
            reason: "unmapped_required_fields",
            unmappedFields: ["category"],
            eligibleCount: 0,
            excludedCount: 1,
            eligibleRecordNumbers: [],
            excludedRecords: []
        });
        expect(unmapped.customerSalesByDate.unmappedFields).toEqual(["customerId"]);
        expect(unmapped.overallNetSales.status).toBe("available");
    });

    it("reports no eligible records for an empty prepared array", () => {
        expect(buildAnalysisEligibility([], mapping).overallNetSales).toMatchObject({
            status: "unavailable",
            reason: "no_eligible_records",
            eligibleCount: 0,
            excludedCount: 0
        });
    });
});

describe("selectAnalysisRows", () => {
    const result = {
        preparedRows: rows,
        analysisEligibility: buildAnalysisEligibility(rows, mapping)
    };

    it.each([{ status: "failed" }, undefined])("blocks analytics for integrity %s", (integrity) => {
        expect(selectAnalysisRows({ ...result, integrity }, "overallNetSales")).toEqual({
            status: "blocked",
            reason: "integrity_not_passed",
            rows: []
        });
    });

    it("returns only eligible rows in source order after integrity passes", () => {
        const checked = { ...result, integrity: { status: "passed" } };

        expect(selectAnalysisRows(checked, "dailySalesTrends")).toEqual({
            status: "available",
            reason: null,
            rows: [rows[0], rows[2]]
        });
        expect(selectAnalysisRows(checked, "toString")).toEqual({
            status: "blocked",
            reason: "unknown_operation",
            rows: []
        });
    });

    it("returns the reason when the operation is unavailable", () => {
        const checked = {
            preparedRows: rows,
            analysisEligibility: buildAnalysisEligibility(rows, { date: "day", amount: "total" }),
            integrity: { status: "passed" }
        };

        expect(selectAnalysisRows(checked, "salesByCategory")).toEqual({
            status: "unavailable",
            reason: "unmapped_required_fields",
            rows: []
        });
    });
});
