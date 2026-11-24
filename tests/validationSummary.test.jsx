import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PaginatedRecordList from "../src/components/upload/PaginatedRecordList.jsx";
import ValidationSummary from "../src/components/upload/ValidationSummary.jsx";
import { getAnalysisReadiness } from "../src/components/upload/validationReportPresentation.js";

const available = {
    status: "available",
    reason: null,
    eligibleCount: 2,
    excludedCount: 1,
    excludedRecords: [{ recordNumber: 3, reasons: ["INVALID_AMOUNT"] }]
};

const customerUnavailable = {
    status: "unavailable",
    reason: "unmapped_required_fields",
    unmappedFields: ["customerId"],
    eligibleCount: 0,
    excludedCount: 3,
    excludedRecords: []
};

const result = {
    report: {
        totalRows: 3,
        validDateRows: 3,
        validAmountRows: 2,
        validSalesRows: 2,
        missingDates: 0,
        invalidDates: 0,
        missingAmounts: 0,
        invalidAmounts: 1,
        negativeAmounts: 0,
        zeroAmounts: 1,
        missingCustomerIds: 0,
        highValueOutlierCount: 0
    },
    issues: [
        { code: "INVALID_AMOUNT", severity: "error", field: "amount", recordNumber: 3 },
        { code: "REPEATED_ORDER_ID", severity: "warning", field: "orderId", recordNumber: 1 },
        { code: "POSSIBLE_DUPLICATE", severity: "warning", field: null, recordNumber: 2 }
    ],
    outlierAnalysis: { status: "unavailable", reason: "insufficient_sample", eligibleCount: 2 },
    analysisEligibility: {
        overallNetSales: available,
        dailySalesTrends: available,
        salesByCategory: available,
        customerLinkedSales: customerUnavailable,
        customerSalesByDate: customerUnavailable
    },
    integrity: { status: "passed", violations: [] }
};

function renderReport(validationResult, busy = false) {
    return renderToStaticMarkup(
        <ValidationSummary
            validationResult={validationResult}
            initialProfile={{ totalColumns: 5, unmappedColumnCount: 1 }}
            confirmedMapping={{ date: "day", amount: "total", category: "group" }}
            readiness={getAnalysisReadiness({ currentStep: 4, validationResult, busy })}
            busy={busy}
        />
    );
}

describe("ValidationSummary", () => {
    it("renders the report, issue severity and all five analysis operations", () => {
        const html = renderReport(result);

        for (const text of [
            "Data Quality Report",
            "CSV columns",
            "Unmapped columns",
            "Zero amounts",
            "Invalid amounts",
            "Possible duplicates",
            "Repeated Order IDs",
            "Error",
            "Warning",
            "View excluded records",
            "Overall net sales",
            "Daily sales trends",
            "Sales by category",
            "Customer-linked sales",
            "Customer sales by date",
            "Map the required fields: Customer ID",
            "Ready for analytics"
        ]) {
            expect(html).toContain(text);
        }

        expect(html).toContain("At least 20 valid nonnegative amounts");
        expect(html).not.toContain("Missing Customer IDs");
    });

    it("shows a blocking integrity alert even when operations are available", () => {
        const html = renderReport({
            ...result,
            integrity: {
                status: "failed",
                violations: [{ code: "ROW_COUNT_MISMATCH", recordNumber: null, field: "totalRows" }]
            }
        });

        expect(html).toContain('role="alert"');
        expect(html).toContain("Analytics is blocked");
        expect(html).toContain("View integrity violations (1)");
        expect(html).toContain("Analytics unavailable");
        expect(html).not.toContain("Ready for analytics");
    });

    it("keeps the exact threshold string and shows an empty issues state", () => {
        const html = renderReport({
            ...result,
            issues: [],
            outlierAnalysis: {
                status: "available",
                eligibleCount: 20,
                upperThreshold: "0.000003125"
            }
        });

        expect(html).toContain("0.000003125");
        expect(html).toContain("No record errors or warnings were detected.");
    });

    it("shows an appropriate message when data is missing or still processing", () => {
        expect(renderReport(null)).toContain("Complete validation to view this report");
        expect(renderReport(null, true)).toContain("Waiting for dataset validation");
    });
});

describe("PaginatedRecordList", () => {
    it("renders only the first 50 entries with accessible paging controls", () => {
        const html = renderToStaticMarkup(
            <PaginatedRecordList
                items={Array.from({ length: 120 }, (_, index) => index + 1)}
                label="Excluded records"
                getKey={(recordNumber) => recordNumber}
                renderItem={(recordNumber) => `Record #${recordNumber}`}
            />
        );

        expect(html.match(/<li>/g)).toHaveLength(50);
        expect(html).toContain("Record #50</li>");
        expect(html).not.toContain("Record #51</li>");
        expect(html).toContain('aria-label="Excluded records pagination"');
        expect(html).toMatch(/<button[^>]*disabled[^>]*>Previous/);
        expect(html).toContain(">Next</button>");
    });
});
