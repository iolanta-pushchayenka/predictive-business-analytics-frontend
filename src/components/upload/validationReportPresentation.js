export const ANALYSIS_OPERATIONS = [
    { key: "overallNetSales", label: "Overall net sales" },
    { key: "dailySalesTrends", label: "Daily sales trends" },
    { key: "salesByCategory", label: "Sales by category" },
    { key: "customerLinkedSales", label: "Customer-linked sales" },
    { key: "customerSalesByDate", label: "Customer sales by date" }
];

const FIELD_LABELS = {
    date: "Date",
    amount: "Amount",
    customerId: "Customer ID",
    orderId: "Order ID",
    category: "Category"
};

const ISSUE_COPY = {
    MISSING_DATE: ["Missing dates", "A date is required for analyses by date."],
    INVALID_DATE: ["Invalid dates", "These dates do not match the selected format or calendar."],
    MISSING_AMOUNT: ["Missing amounts", "A valid amount is required for every sales analysis."],
    INVALID_AMOUNT: [
        "Invalid amounts",
        "These amounts could not be read using the selected format."
    ],
    NEGATIVE_AMOUNT: [
        "Negative amounts",
        "Valid signed amounts may represent refunds or adjustments."
    ],
    POSSIBLE_DUPLICATE: [
        "Possible duplicates",
        "These records have matching mapped values. They remain in the dataset."
    ],
    REPEATED_ORDER_ID: [
        "Repeated Order IDs",
        "Several records share an Order ID. One order may contain several records."
    ],
    HIGH_VALUE_OUTLIER: [
        "Potential high-value outliers",
        "These amounts are above the calculated upper threshold and remain in the dataset."
    ]
};

const EXCLUSION_LABELS = {
    MISSING_AMOUNT: "Missing amount",
    INVALID_AMOUNT: "Invalid amount",
    MISSING_DATE: "Missing date",
    INVALID_DATE: "Invalid date",
    MISSING_CATEGORY: "Missing category",
    MISSING_CUSTOMER_ID: "Missing Customer ID"
};

export const PAGE_SIZE = 50;

export function fieldLabel(field) {
    return Object.hasOwn(FIELD_LABELS, field) ? FIELD_LABELS[field] : field;
}

export function exclusionLabel(reason) {
    return Object.hasOwn(EXCLUSION_LABELS, reason) ? EXCLUSION_LABELS[reason] : reason;
}

export function groupValidationIssues(issues) {
    const groups = new Map();

    for (const { code, field, severity, recordNumber } of issues) {
        const key = JSON.stringify([code, field, severity]);
        let group = groups.get(key);

        if (!group) {
            let label = code;
            let description = "";

            if (code === "MISSING_OPTIONAL_VALUE") {
                label = `Missing ${fieldLabel(field)} values`;
                description = "The column is mapped, but these records have an empty value.";
            } else if (Object.hasOwn(ISSUE_COPY, code)) {
                [label, description] = ISSUE_COPY[code];
            }

            group = { key, severity, label, description, recordNumbers: [] };
            groups.set(key, group);
        }

        group.recordNumbers.push(recordNumber);
    }

    return [...groups.values()];
}

export function getOperationReason(operation) {
    if (!operation) return "Availability information is missing.";

    if (operation.reason === "unmapped_required_fields") {
        const fields = operation.unmappedFields.map(fieldLabel).join(", ");
        return `Map the required fields: ${fields}.`;
    }

    if (operation.reason === "no_eligible_records") {
        return "No records meet the requirements for this operation.";
    }

    return "This operation is unavailable.";
}

export function getOutlierUnavailableReason(analysis) {
    if (!analysis) return "Outlier diagnostics are missing.";

    if (analysis.reason === "insufficient_sample") {
        return "At least 20 valid nonnegative amounts are required.";
    }

    if (analysis.reason === "zero_iqr") {
        return "The lower and upper quartiles are equal, so an upper threshold was not calculated.";
    }

    return "Outlier analysis is unavailable.";
}

export function getAnalysisReadiness({ currentStep, validationResult, busy }) {
    if (busy) {
        return { canProceed: false, message: "Wait for file processing to complete." };
    }

    if (currentStep !== 4 || !validationResult) {
        return { canProceed: false, message: "Complete dataset validation first." };
    }

    const { integrity, analysisEligibility } = validationResult;

    if (integrity?.status !== "passed") {
        return {
            canProceed: false,
            message:
                integrity?.status === "failed"
                    ? "Resolve the preparation integrity errors before analysis."
                    : "A successful integrity check is required before analysis."
        };
    }

    const hasAvailableOperation = ANALYSIS_OPERATIONS.some(({ key }) => {
        const operation = analysisEligibility?.[key];
        return operation?.status === "available" && operation.eligibleCount > 0;
    });

    return hasAvailableOperation
        ? { canProceed: true, message: "At least one analytical operation is available." }
        : { canProceed: false, message: "No analytical operation has eligible records." };
}

export function getRecordPage(items, requestedPage) {
    const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    const page = Math.min(Math.max(requestedPage, 0), pageCount - 1);
    const start = page * PAGE_SIZE;

    return {
        page,
        pageCount,
        first: items.length ? start + 1 : 0,
        last: Math.min(start + PAGE_SIZE, items.length),
        items: items.slice(start, start + PAGE_SIZE)
    };
}
