import { describe, expect, it } from "vitest";
import { parseCsv } from "../src/utils/parseCsv.js";
import { validateDataset } from "../src/utils/validateDataset.js";
import { selectAnalysisRows } from "../src/utils/buildAnalysisEligibility.js";

const columns = ["day", "total", "customer", "order", "group", "note"];
const requiredMapping = { date: "day", amount: "total" };
const fullMapping = {
    ...requiredMapping,
    customerId: "customer",
    orderId: "order",
    category: "group"
};
const formats = { date: "DMY_SLASH", amount: "dot" };

describe("validateDataset", () => {
    it("normalizes mapped fields and preserves the existing result shape", () => {
        const rows = [
            {
                day: "1/11/2026",
                total: "012.500",
                customer: " 001 ",
                order: " Ab-01 ",
                group: " Books "
            }
        ];

        const result = validateDataset(rows, columns, fullMapping, formats);

        const { analysisEligibility, integrity, ...previousResult } = result;

        expect(previousResult).toEqual({
            preparedRows: [
                {
                    recordNumber: 1,
                    date: "2026-11-01",
                    amount: "12.5",
                    customerId: "001",
                    orderId: "Ab-01",
                    category: "Books",
                    dateStatus: "valid",
                    amountStatus: "valid",
                    validForSales: true
                }
            ],
            report: {
                totalRows: 1,
                validDateRows: 1,
                validAmountRows: 1,
                validSalesRows: 1,
                missingDates: 0,
                invalidDates: 0,
                missingAmounts: 0,
                invalidAmounts: 0,
                negativeAmounts: 0,
                zeroAmounts: 0,
                highValueOutlierCount: 0,
                missingCustomerIds: 0
            },
            issues: [],
            outlierAnalysis: {
                status: "unavailable",
                reason: "insufficient_sample",
                eligibleCount: 1,
                q1: null,
                q3: null,
                iqr: null,
                upperThreshold: null
            }
        });
        expect(analysisEligibility.overallNetSales).toMatchObject({
            status: "available",
            eligibleCount: 1,
            eligibleRecordNumbers: [1]
        });
        expect(integrity).toEqual({ status: "passed", violations: [] });
    });

    it("reports missing and invalid values without inventing replacements", () => {
        const rows = [
            { day: " ", total: "", customer: " \t", order: "", group: "" },
            { day: "31/02/2026", total: "unknown", customer: "001", order: "A", group: "Books" }
        ];

        const { preparedRows, report, issues } = validateDataset(
            rows,
            columns,
            fullMapping,
            formats
        );

        expect(issues).toEqual([
            { code: "MISSING_DATE", severity: "error", recordNumber: 1, field: "date" },
            { code: "MISSING_AMOUNT", severity: "error", recordNumber: 1, field: "amount" },
            {
                code: "MISSING_OPTIONAL_VALUE",
                severity: "warning",
                recordNumber: 1,
                field: "customerId"
            },
            {
                code: "MISSING_OPTIONAL_VALUE",
                severity: "warning",
                recordNumber: 1,
                field: "orderId"
            },
            {
                code: "MISSING_OPTIONAL_VALUE",
                severity: "warning",
                recordNumber: 1,
                field: "category"
            },
            { code: "INVALID_DATE", severity: "error", recordNumber: 2, field: "date" },
            { code: "INVALID_AMOUNT", severity: "error", recordNumber: 2, field: "amount" }
        ]);
        expect(preparedRows[0]).toMatchObject({
            date: null,
            amount: null,
            customerId: null,
            orderId: null,
            category: null
        });
        expect(preparedRows.map((row) => row.validForSales)).toEqual([false, false]);
        expect(report).toMatchObject({
            missingDates: 1,
            invalidDates: 1,
            missingAmounts: 1,
            invalidAmounts: 1,
            missingCustomerIds: 1,
            validSalesRows: 0
        });
    });

    it("warns about negative amounts and keeps zero and negatives valid for sales", () => {
        const rows = [
            { day: "1/11/2026", total: "-5.00" },
            { day: "1/11/2026", total: "0.00" }
        ];

        const { preparedRows, report, issues } = validateDataset(
            rows,
            columns,
            requiredMapping,
            formats
        );

        expect(issues).toEqual([
            { code: "NEGATIVE_AMOUNT", severity: "warning", recordNumber: 1, field: "amount" }
        ]);
        expect(preparedRows.map((row) => [row.amount, row.validForSales])).toEqual([
            ["-5", true],
            ["0", true]
        ]);
        expect(report).toMatchObject({ negativeAmounts: 1, validSalesRows: 2 });
    });

    it("flags normalized duplicates and checks repeated Order IDs independently", () => {
        const rows = [
            {
                day: "1/11/2026",
                total: "12.50",
                customer: "001",
                order: " A ",
                group: "Books",
                note: "web"
            },
            {
                day: "01/11/2026",
                total: "012.500",
                customer: " 001 ",
                order: "A",
                group: "Books",
                note: "store"
            },
            { day: "1/11/2026", total: "12.50", customer: "1", order: "A", group: "Books" },
            { day: "bad", total: "12.50", customer: "001", order: "A", group: "Books" },
            { day: "bad", total: "12.50", customer: "001", order: "A", group: "Books" },
            { day: "1/11/2026", total: "", customer: "001", order: "a", group: "Books" },
            { day: "1/11/2026", total: "", customer: "001", order: "001", group: "Books" },
            { day: "1/11/2026", total: "", customer: "001", order: "1", group: "Books" },
            { day: "1/11/2026", total: "", customer: "001", order: "1", group: "Books" }
        ];

        const result = validateDataset(rows, columns, fullMapping, formats);
        const duplicateIssues = result.issues.filter(
            (issue) => issue.code === "POSSIBLE_DUPLICATE"
        );
        const orderIssues = result.issues.filter((issue) => issue.code === "REPEATED_ORDER_ID");

        expect(duplicateIssues).toEqual([
            { code: "POSSIBLE_DUPLICATE", severity: "warning", recordNumber: 1, field: null },
            { code: "POSSIBLE_DUPLICATE", severity: "warning", recordNumber: 2, field: null }
        ]);
        expect(orderIssues.map((issue) => issue.recordNumber)).toEqual([1, 2, 3, 4, 5, 8, 9]);
        expect(
            orderIssues.every((issue) => issue.severity === "warning" && issue.field === "orderId")
        ).toBe(true);
        expect(result.preparedRows.map((row) => row.recordNumber)).toEqual([
            1, 2, 3, 4, 5, 6, 7, 8, 9
        ]);
        expect(validateDataset(rows, columns, fullMapping, formats)).toEqual(result);
    });

    it("retains field boundaries in duplicate keys and skips empty Order IDs", () => {
        const rows = [
            { day: "1/11/2026", total: "5", customer: "a,b", order: "", group: "c" },
            { day: "1/11/2026", total: "5", customer: "a", order: " ", group: "b,c" }
        ];

        const { issues } = validateDataset(rows, columns, fullMapping, formats);

        expect(issues).toEqual([
            {
                code: "MISSING_OPTIONAL_VALUE",
                severity: "warning",
                recordNumber: 1,
                field: "orderId"
            },
            {
                code: "MISSING_OPTIONAL_VALUE",
                severity: "warning",
                recordNumber: 2,
                field: "orderId"
            }
        ]);
    });

    it("keeps the Phase 1 record ordinals and leaves parsed rows untouched", async () => {
        const csv = "day,total,order\n1/11/2026,005.00,A\n\n01/11/2026,5,A\n";
        const dataset = await parseCsv(csv);
        const originalRows = dataset.rows.map((row) => ({ ...row }));
        dataset.rows.forEach(Object.freeze);
        Object.freeze(dataset.rows);
        Object.freeze(dataset.columns);

        const { preparedRows, issues } = validateDataset(
            dataset.rows,
            dataset.columns,
            requiredMapping,
            formats
        );

        expect(dataset.rows).toEqual(originalRows);
        expect(preparedRows.map((row) => row.recordNumber)).toEqual([1, 2]);
        expect(preparedRows.map((row) => row.amount)).toEqual(["5", "5"]);
        expect(issues).toEqual([
            { code: "POSSIBLE_DUPLICATE", severity: "warning", recordNumber: 1, field: null },
            { code: "POSSIBLE_DUPLICATE", severity: "warning", recordNumber: 2, field: null }
        ]);
    });

    it("counts zeros and flags high amounts without changing Phase 2 behavior", () => {
        const amounts = [
            "0", "0.00", "-0.00", "+0", "00.000", " 0 ",
            ...Array(12).fill("2"),
            "5", "5.000001", "-10.50", "", "invalid"
        ];
        const rows = Object.freeze(
            amounts.map((total, index) =>
                Object.freeze({ day: index === 19 ? "invalid date" : "1/11/2026", total })
            )
        );
        const result = validateDataset(rows, columns, requiredMapping, formats);
        expect(result.integrity).toEqual({ status: "passed", violations: [] });
        expect(result.analysisEligibility.overallNetSales.eligibleRecordNumbers).toContain(20);
        expect(result.analysisEligibility.dailySalesTrends.eligibleRecordNumbers).not.toContain(20);

        expect(result.report).toMatchObject({
            totalRows: 23,
            zeroAmounts: 6,
            negativeAmounts: 1,
            highValueOutlierCount: 1,
            validAmountRows: 21,
            validSalesRows: 20
        });
        expect(result.outlierAnalysis).toEqual({
            status: "available",
            reason: null,
            eligibleCount: 20,
            q1: "0",
            q3: "2",
            iqr: "2",
            upperThreshold: "5"
        });
        expect(result.issues.filter(({ code }) => code === "NEGATIVE_AMOUNT")).toEqual([
            { code: "NEGATIVE_AMOUNT", severity: "warning", recordNumber: 21, field: "amount" }
        ]);
        expect(result.issues.filter(({ code }) => code === "HIGH_VALUE_OUTLIER")).toEqual([
            { code: "HIGH_VALUE_OUTLIER", severity: "warning", recordNumber: 20, field: "amount" }
        ]);
        expect(result.preparedRows.map(({ recordNumber }) => recordNumber)).toEqual(
            amounts.map((_, index) => index + 1)
        );
        expect(result.preparedRows[18]).toMatchObject({ amount: "5", validForSales: true });
        expect(result.preparedRows[19]).toMatchObject({
            amount: "5.000001",
            amountStatus: "valid",
            dateStatus: "invalid",
            validForSales: false
        });
        expect(result.preparedRows[20]).toMatchObject({
            amount: "-10.5",
            amountStatus: "negative",
            validForSales: true
        });
        expect(rows.map(({ total }) => total)).toEqual(amounts);
    });

    it("keeps CSV record numbers and selects eligible rows without mutating the source", async () => {
        const csv =
            "day,total,customer,order,group\n" +
            "1/11/2026,012.50,001,A,Books\n" +
            "\n" +
            "01/11/2026,12.5,001,A,Books\n" +
            "bad date,-5,001,A,Books\n" +
            "2/11/2026,0,,B,\n" +
            "2/11/2026,,002,C,Books\n";
        const dataset = await parseCsv(csv);
        const originalRows = dataset.rows.map((row) => ({ ...row }));
        dataset.rows.forEach(Object.freeze);
        Object.freeze(dataset.rows);
        Object.freeze(dataset.columns);

        const result = validateDataset(dataset.rows, dataset.columns, fullMapping, formats);

        expect(result.integrity).toEqual({ status: "passed", violations: [] });
        expect(result.preparedRows.map(({ recordNumber }) => recordNumber)).toEqual([
            1, 2, 3, 4, 5
        ]);
        expect(result.report).toMatchObject({
            totalRows: 5,
            validSalesRows: 3,
            zeroAmounts: 1,
            negativeAmounts: 1
        });
        expect(result.outlierAnalysis).toMatchObject({
            status: "unavailable",
            reason: "insufficient_sample",
            eligibleCount: 3
        });

        const expected = {
            overallNetSales: [1, 2, 3, 4],
            dailySalesTrends: [1, 2, 4],
            salesByCategory: [1, 2, 3],
            customerLinkedSales: [1, 2, 3],
            customerSalesByDate: [1, 2]
        };

        for (const [operation, recordNumbers] of Object.entries(expected)) {
            const selected = selectAnalysisRows(result, operation);

            expect(selected.status).toBe("available");
            expect(selected.rows.map(({ recordNumber }) => recordNumber)).toEqual(recordNumbers);
        }

        expect(dataset.rows).toEqual(originalRows);
    });
});
