import { describe, expect, it } from "vitest";
import { parseCsv } from "../src/utils/parseCsv.js";
import { validateDataset } from "../src/utils/validateDataset.js";

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

        expect(result).toEqual({
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
                missingCustomerIds: 0
            },
            issues: []
        });
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
});
