import { describe, expect, it } from "vitest";
import {
    getAnalysisReadiness,
    getOperationReason,
    getOutlierUnavailableReason,
    getRecordPage,
    groupValidationIssues
} from "../src/components/upload/validationReportPresentation.js";

function readiness(overrides = {}) {
    return getAnalysisReadiness({
        currentStep: 4,
        busy: false,
        validationResult: {
            integrity: { status: "passed" },
            analysisEligibility: {
                overallNetSales: { status: "available", eligibleCount: 1 },
                dailySalesTrends: { status: "unavailable", eligibleCount: 0 }
            }
        },
        ...overrides
    });
}

describe("getAnalysisReadiness", () => {
    it("allows partial availability with passed integrity", () => {
        expect(readiness().canProceed).toBe(true);
    });

    it.each([
        { currentStep: 3 },
        { busy: true },
        { validationResult: null },
        { validationResult: {} },
        {
            validationResult: {
                integrity: { status: "failed" },
                analysisEligibility: {
                    overallNetSales: { status: "available", eligibleCount: 10 }
                }
            }
        },
        {
            validationResult: {
                integrity: { status: "passed" },
                analysisEligibility: {
                    dailySalesTrends: { status: "unavailable", eligibleCount: 0 }
                }
            }
        },
        {
            validationResult: {
                integrity: { status: "passed" },
                analysisEligibility: {
                    overallNetSales: { status: "available", eligibleCount: 0 }
                }
            }
        }
    ])("blocks analytics with %j", (options) => {
        const result = readiness(options);

        expect(result.canProceed).toBe(false);
        expect(result.message).toBeTruthy();
    });
});

describe("report presentation", () => {
    it("groups existing issues by code, field and severity in source order", () => {
        const issues = Object.freeze([
            Object.freeze({
                code: "MISSING_OPTIONAL_VALUE",
                severity: "warning",
                field: "category",
                recordNumber: 2
            }),
            Object.freeze({
                code: "MISSING_OPTIONAL_VALUE",
                severity: "warning",
                field: "customerId",
                recordNumber: 3
            }),
            Object.freeze({
                code: "MISSING_OPTIONAL_VALUE",
                severity: "warning",
                field: "category",
                recordNumber: 4
            }),
            Object.freeze({
                code: "INVALID_AMOUNT",
                severity: "error",
                field: "amount",
                recordNumber: 5
            })
        ]);

        expect(groupValidationIssues(issues)).toMatchObject([
            { label: "Missing Category values", severity: "warning", recordNumbers: [2, 4] },
            { label: "Missing Customer ID values", severity: "warning", recordNumbers: [3] },
            { label: "Invalid amounts", severity: "error", recordNumbers: [5] }
        ]);
        expect(groupValidationIssues([])).toEqual([]);
    });

    it("distinguishes unmapped fields from zero eligible records", () => {
        expect(
            getOperationReason({
                reason: "unmapped_required_fields",
                unmappedFields: ["customerId"]
            })
        ).toContain("Customer ID");
        expect(getOperationReason({ reason: "no_eligible_records" })).toContain("No records");
    });

    it("explains both unavailable IQR states", () => {
        expect(getOutlierUnavailableReason({ reason: "insufficient_sample" })).toContain("20");
        expect(getOutlierUnavailableReason({ reason: "zero_iqr" })).toContain(
            "quartiles are equal"
        );
    });

    it("returns only a single bounded page and correct final-page offsets", () => {
        const records = Array.from({ length: 120 }, (_, index) => index + 1);

        expect(getRecordPage(records, 0)).toMatchObject({ first: 1, last: 50, pageCount: 3 });
        expect(getRecordPage(records, 0).items).toHaveLength(50);
        expect(getRecordPage(records, 1).items).toEqual(records.slice(50, 100));
        expect(getRecordPage(records, 99)).toEqual({
            page: 2,
            pageCount: 3,
            first: 101,
            last: 120,
            items: records.slice(100)
        });
        expect(getRecordPage([], 0)).toMatchObject({ first: 0, last: 0, items: [] });
    });
});
