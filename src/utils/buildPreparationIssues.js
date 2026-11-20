export const OPTIONAL_FIELDS = ["customerId", "orderId", "category"];
export const MAPPING_FIELDS = ["date", "amount", ...OPTIONAL_FIELDS];

const DATE_ISSUES = {
    missing: "MISSING_DATE",
    invalid: "INVALID_DATE"
};

const AMOUNT_ISSUES = {
    missing: "MISSING_AMOUNT",
    invalid: "INVALID_AMOUNT"
};

export function normalizeOptionalText(row, column) {
    if (!column) return null;

    const value = row[column];
    return value == null ? null : String(value).trim() || null;
}

function collectRepeatedKeys(rows, keyForRow) {
    const seen = new Set();
    const repeated = new Set();

    for (const row of rows) {
        const key = keyForRow(row);
        if (key === null) continue;

        if (seen.has(key)) {
            repeated.add(key);
        } else {
            seen.add(key);
        }
    }

    return repeated;
}

function appendMatchIssues(preparedRows, mapping, issues) {
    const mappedFields = MAPPING_FIELDS.filter((field) => Boolean(mapping[field]));

    function duplicateKey(row) {
        if (!row.validForSales) return null;

        return JSON.stringify(mappedFields.map((field) => row[field]));
    }

    const duplicateKeys = collectRepeatedKeys(preparedRows, duplicateKey);
    const repeatedOrderIds = collectRepeatedKeys(preparedRows, (row) => row.orderId);

    for (const row of preparedRows) {
        if (duplicateKeys.has(duplicateKey(row))) {
            issues.push({
                code: "POSSIBLE_DUPLICATE",
                severity: "warning",
                recordNumber: row.recordNumber,
                field: null
            });
        }

        if (repeatedOrderIds.has(row.orderId)) {
            issues.push({
                code: "REPEATED_ORDER_ID",
                severity: "warning",
                recordNumber: row.recordNumber,
                field: "orderId"
            });
        }
    }
}

export function buildPreparationIssues(preparedRows, mapping, outlierRecordNumbers) {
    const issues = [];

    for (const row of preparedRows) {
        const { recordNumber, dateStatus, amountStatus } = row;

        if (Object.hasOwn(DATE_ISSUES, dateStatus)) {
            issues.push({
                code: DATE_ISSUES[dateStatus],
                severity: "error",
                recordNumber,
                field: "date"
            });
        }

        if (Object.hasOwn(AMOUNT_ISSUES, amountStatus)) {
            issues.push({
                code: AMOUNT_ISSUES[amountStatus],
                severity: "error",
                recordNumber,
                field: "amount"
            });
        }

        if (amountStatus === "negative") {
            issues.push({
                code: "NEGATIVE_AMOUNT",
                severity: "warning",
                recordNumber,
                field: "amount"
            });
        }

        for (const field of OPTIONAL_FIELDS) {
            if (mapping[field] && row[field] === null) {
                issues.push({
                    code: "MISSING_OPTIONAL_VALUE",
                    severity: "warning",
                    recordNumber,
                    field
                });
            }
        }
    }

    appendMatchIssues(preparedRows, mapping, issues);

    for (const recordNumber of outlierRecordNumbers) {
        issues.push({
            code: "HIGH_VALUE_OUTLIER",
            severity: "warning",
            recordNumber,
            field: "amount"
        });
    }

    return issues;
}
