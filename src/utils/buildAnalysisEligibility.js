const REQUIRED_FIELDS = {
    overallNetSales: ["amount"],
    dailySalesTrends: ["amount", "date"],
    salesByCategory: ["amount", "category"],
    customerLinkedSales: ["amount", "customerId"],
    customerSalesByDate: ["amount", "date", "customerId"]
};

export function hasValidAmount(row) {
    return row.amountStatus === "valid" || row.amountStatus === "negative";
}

const exclusionReasons = {
    amount(row) {
        if (hasValidAmount(row)) return null;
        return row.amountStatus === "missing" ? "MISSING_AMOUNT" : "INVALID_AMOUNT";
    },
    date(row) {
        if (row.dateStatus === "valid") return null;
        return row.dateStatus === "missing" ? "MISSING_DATE" : "INVALID_DATE";
    },
    category: (row) => (row.category === null ? "MISSING_CATEGORY" : null),
    customerId: (row) => (row.customerId === null ? "MISSING_CUSTOMER_ID" : null)
};

export function buildAnalysisEligibility(preparedRows, mapping) {
    const operations = {};

    for (const [operation, requiredFields] of Object.entries(REQUIRED_FIELDS)) {
        const unmappedFields = requiredFields.filter((field) => !mapping[field]);
        const eligibleRecordNumbers = [];
        const excludedRecords = [];

        if (unmappedFields.length > 0) {
            operations[operation] = {
                status: "unavailable",
                reason: "unmapped_required_fields",
                unmappedFields,
                eligibleCount: 0,
                excludedCount: preparedRows.length,
                eligibleRecordNumbers,
                excludedRecords
            };
            continue;
        }

        for (const row of preparedRows) {
            const reasons = requiredFields
                .map((field) => exclusionReasons[field](row))
                .filter((reason) => reason !== null);

            if (reasons.length > 0) {
                excludedRecords.push({ recordNumber: row.recordNumber, reasons });
            } else {
                eligibleRecordNumbers.push(row.recordNumber);
            }
        }

        const available = eligibleRecordNumbers.length > 0;

        operations[operation] = {
            status: available ? "available" : "unavailable",
            reason: available ? null : "no_eligible_records",
            unmappedFields,
            eligibleCount: eligibleRecordNumbers.length,
            excludedCount: excludedRecords.length,
            eligibleRecordNumbers,
            excludedRecords
        };
    }

    return operations;
}

/** Future analytics must request its input through this selector. */
export function selectAnalysisRows(result, operation) {
    if (result?.integrity?.status !== "passed") {
        return { status: "blocked", reason: "integrity_not_passed", rows: [] };
    }

    if (!Object.hasOwn(REQUIRED_FIELDS, operation)) {
        return { status: "blocked", reason: "unknown_operation", rows: [] };
    }

    const eligibility = result.analysisEligibility?.[operation];

    if (eligibility?.status !== "available") {
        return {
            status: "unavailable",
            reason: eligibility?.reason ?? "eligibility_unavailable",
            rows: []
        };
    }

    const selected = new Set(eligibility.eligibleRecordNumbers);
    const rows = result.preparedRows.filter((row) => selected.has(row.recordNumber));

    return { status: "available", reason: null, rows };
}
