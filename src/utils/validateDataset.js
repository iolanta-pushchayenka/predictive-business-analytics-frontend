import { normalizeDate } from "./normalizeDate.js";
import { normalizeAmount } from "./normalizeAmount.js";

const OPTIONAL_FIELDS = ["customerId", "orderId", "category"];
const MAPPING_FIELDS = ["date", "amount", ...OPTIONAL_FIELDS];

const DATE_ISSUES = {
    missing: "MISSING_DATE",
    invalid: "INVALID_DATE"
};

const AMOUNT_ISSUES = {
    missing: "MISSING_AMOUNT",
    invalid: "INVALID_AMOUNT"
};

// Validate the selected columns against the CSV headers
export function validateMapping(columns, mapping) {
    if (!Array.isArray(columns) || columns.length === 0) {
        throw new Error("CSV columns are required");
    }

    if (!mapping?.date || !mapping?.amount) {
        throw new Error("Date and amount columns are required");
    }

    const selected = MAPPING_FIELDS.map((field) => mapping[field]).filter(Boolean);

    for (const column of selected) {
        if (!columns.includes(column)) {
            throw new Error(`CSV column not found: ${column}`);
        }
    }

    if (new Set(selected).size !== selected.length) {
        throw new Error("CSV columns cannot be mapped more than once");
    }
}

// Return an optional text field or null
function normalizeOptionalText(row, column) {
    if (!column) return null;

    const value = row[column];

    if (value === null || value === undefined) {
        return null;
    }

    return String(value).trim() || null;
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

/**
 * Validate and normalize records without modifying the source rows.
 * Issues contain { code, severity, recordNumber, field }.
 * recordNumber is the one-based CSV data-record ordinal.
 * field is a business field name, or null for a whole-record issue.
 */
export function validateDataset(rows, columns, mapping, formats) {
    if (!Array.isArray(rows)) {
        throw new Error("Dataset rows must be an array");
    }

    validateMapping(columns, mapping);

    if (!formats?.date || !formats?.amount) {
        throw new Error("Date and amount formats are required");
    }

    if (rows.length === 0) {
        throw new Error("CSV contains no data rows");
    }

    const issues = [];
    const report = {
        totalRows: rows.length,
        validDateRows: 0,
        validAmountRows: 0,
        validSalesRows: 0,
        missingDates: 0,
        invalidDates: 0,
        missingAmounts: 0,
        invalidAmounts: 0,
        negativeAmounts: 0,
        missingCustomerIds: 0
    };

    const preparedRows = rows.map((row, index) => {
        const recordNumber = index + 1;
        const dateResult = normalizeDate(row[mapping.date], formats.date, {
            twoDigitYearCentury: formats.twoDigitYearCentury
        });
        const amountResult = normalizeAmount(row[mapping.amount], formats.amount);

        const dateIssue = DATE_ISSUES[dateResult.status];
        if (dateIssue) {
            issues.push({
                code: dateIssue,
                severity: "error",
                recordNumber,
                field: "date"
            });
        }

        const amountIssue = AMOUNT_ISSUES[amountResult.status];
        if (amountIssue) {
            issues.push({
                code: amountIssue,
                severity: "error",
                recordNumber,
                field: "amount"
            });
        }

        const isNegativeAmount = amountResult.status === "negative";
        if (isNegativeAmount) {
            issues.push({
                code: "NEGATIVE_AMOUNT",
                severity: "warning",
                recordNumber,
                field: "amount"
            });
        }

        const optional = {};

        for (const field of OPTIONAL_FIELDS) {
            const column = mapping[field];
            const value = normalizeOptionalText(row, column);
            optional[field] = value;

            if (column && value === null) {
                issues.push({
                    code: "MISSING_OPTIONAL_VALUE",
                    severity: "warning",
                    recordNumber,
                    field
                });
            }
        }

        const validDate = dateResult.status === "valid";
        const validAmount = amountResult.status === "valid" || isNegativeAmount;
        const validForSales = validDate && validAmount;

        if (validDate) report.validDateRows++;
        if (validAmount) report.validAmountRows++;
        if (validForSales) report.validSalesRows++;
        if (dateResult.status === "missing") report.missingDates++;
        if (dateResult.status === "invalid") report.invalidDates++;
        if (amountResult.status === "missing") report.missingAmounts++;
        if (amountResult.status === "invalid") report.invalidAmounts++;
        if (isNegativeAmount) report.negativeAmounts++;

        if (mapping.customerId && optional.customerId === null) {
            report.missingCustomerIds++;
        }

        return {
            recordNumber,
            date: dateResult.value,
            amount: amountResult.value,
            ...optional,
            dateStatus: dateResult.status,
            amountStatus: amountResult.status,
            validForSales
        };
    });

    appendMatchIssues(preparedRows, mapping, issues);

    return {
        preparedRows,
        report,
        issues
    };
}
