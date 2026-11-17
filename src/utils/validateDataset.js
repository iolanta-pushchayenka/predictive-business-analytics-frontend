
import { normalizeDate } from "./normalizeDate";
import { normalizeAmount } from "./normalizeAmount";

const MAPPING_FIELDS = [
    "date",
    "amount",
    "customerId",
    "orderId",
    "category"
];

// Validate the selected columns against the CSV headers
function validateMapping(columns, mapping) {
    if (!Array.isArray(columns) || columns.length === 0) {
        throw new Error("CSV columns are required");
    }

    if (!mapping?.date || !mapping?.amount) {
        throw new Error("Date and amount columns are required");
    }

    const selected = MAPPING_FIELDS
        .map((field) => mapping[field])
        .filter(Boolean);

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

// Validate and normalize every CSV record
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
        const dateResult = normalizeDate(
            row[mapping.date],
            formats.date,
            {
                twoDigitYearCentury:
                    formats.twoDigitYearCentury
            }
        );

        const amountResult = normalizeAmount(
            row[mapping.amount],
            formats.amount
        );

        const customerId = normalizeOptionalText(
            row,
            mapping.customerId
        );

        const orderId = normalizeOptionalText(
            row,
            mapping.orderId
        );

        const category = normalizeOptionalText(
            row,
            mapping.category
        );

        const validDate = dateResult.status === "valid";

        const validAmount = (
            amountResult.status === "valid" ||
            amountResult.status === "negative"
        );

        if (validDate) report.validDateRows++;
        if (validAmount) report.validAmountRows++;

        if (dateResult.status === "missing") {
            report.missingDates++;
        }

        if (dateResult.status === "invalid") {
            report.invalidDates++;
        }

        if (amountResult.status === "missing") {
            report.missingAmounts++;
        }

        if (amountResult.status === "invalid") {
            report.invalidAmounts++;
        }

        if (amountResult.status === "negative") {
            report.negativeAmounts++;
        }

        if (mapping.customerId && customerId === null) {
            report.missingCustomerIds++;
        }

        const validForSales = validDate && validAmount;

        if (validForSales) {
            report.validSalesRows++;
        }

        return {
            recordNumber: index + 1,

            date: dateResult.value,
            amount: amountResult.value,
            customerId,
            orderId,
            category,

            dateStatus: dateResult.status,
            amountStatus: amountResult.status,

            validForSales
        };
    });

    return {
        preparedRows,
        report
    };
}
