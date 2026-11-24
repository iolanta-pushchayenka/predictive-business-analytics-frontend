import { normalizeDate } from "./normalizeDate.js";
import { normalizeAmount } from "./normalizeAmount.js";
import { analyzeAmountOutliers } from "./analyzeAmountOutliers.js";
import { buildAnalysisEligibility, hasValidAmount } from "./buildAnalysisEligibility.js";
import {
    buildPreparationIssues,
    MAPPING_FIELDS,
    normalizeOptionalText,
    OPTIONAL_FIELDS
} from "./buildPreparationIssues.js";
import { checkPreparedDatasetIntegrity } from "./checkPreparedDatasetIntegrity.js";

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

/** Prepare records and attach analysis eligibility and integrity diagnostics. */
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
        zeroAmounts: 0,
        highValueOutlierCount: 0,
        missingCustomerIds: 0
    };

    const preparedRows = rows.map((row, index) => {
        const recordNumber = index + 1;
        const dateResult = normalizeDate(row[mapping.date], formats.date, {
            twoDigitYearCentury: formats.twoDigitYearCentury
        });
        const amountResult = normalizeAmount(row[mapping.amount], formats.amount);

        const isNegativeAmount = amountResult.status === "negative";
        const optional = {};

        for (const field of OPTIONAL_FIELDS) {
            optional[field] = normalizeOptionalText(row, mapping[field]);
        }

        const validDate = dateResult.status === "valid";
        const validAmount = hasValidAmount({ amountStatus: amountResult.status });
        const validForSales = validDate && validAmount;

        if (validDate) report.validDateRows++;
        if (validAmount) report.validAmountRows++;
        if (validForSales) report.validSalesRows++;
        if (dateResult.status === "missing") report.missingDates++;
        if (dateResult.status === "invalid") report.invalidDates++;
        if (amountResult.status === "missing") report.missingAmounts++;
        if (amountResult.status === "invalid") report.invalidAmounts++;
        if (isNegativeAmount) report.negativeAmounts++;
        if (amountResult.status === "valid" && amountResult.value === "0") {
            report.zeroAmounts++;
        }

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

    const { diagnostics: outlierAnalysis, outlierRecordNumbers } =
        analyzeAmountOutliers(preparedRows);

    report.highValueOutlierCount = outlierRecordNumbers.length;

    const result = {
        preparedRows,
        report,
        issues: buildPreparationIssues(preparedRows, mapping, outlierRecordNumbers),
        outlierAnalysis,
        analysisEligibility: buildAnalysisEligibility(preparedRows, mapping)
    };

    return {
        ...result,
        integrity: checkPreparedDatasetIntegrity(rows, mapping, result)
    };
}
