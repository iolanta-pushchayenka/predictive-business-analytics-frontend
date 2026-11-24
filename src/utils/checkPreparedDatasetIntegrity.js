import { buildAnalysisEligibility, hasValidAmount } from "./buildAnalysisEligibility.js";
import {
    buildPreparationIssues,
    normalizeOptionalText,
    OPTIONAL_FIELDS
} from "./buildPreparationIssues.js";
import { AMOUNT_FORMATS, normalizeAmount } from "./normalizeAmount.js";
import { DATE_FORMATS, normalizeDate } from "./normalizeDate.js";

const IQR_MIN_SAMPLE_SIZE = 20;
const DIAGNOSTIC_SCALE = 1_000_000_000n;
const CANONICAL_DIAGNOSTIC = /^(?:0|[1-9]\d*)(?:\.\d{0,8}[1-9])?$/;

function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameData(actual, expected) {
    if (actual === expected) return true;

    if (Array.isArray(expected)) {
        return (
            Array.isArray(actual) &&
            actual.length === expected.length &&
            expected.every((value, index) => sameData(actual[index], value))
        );
    }

    if (!isObject(actual) || !isObject(expected)) return false;

    const keys = Object.keys(expected);
    return (
        Object.keys(actual).length === keys.length &&
        keys.every((key) => Object.hasOwn(actual, key) && sameData(actual[key], expected[key]))
    );
}

function hasCanonicalDate(row) {
    if (row.dateStatus === "missing" || row.dateStatus === "invalid") {
        return row.date === null;
    }

    if (row.dateStatus !== "valid" || typeof row.date !== "string") {
        return false;
    }

    const normalized = normalizeDate(row.date, DATE_FORMATS.YMD_DASH);
    return normalized.status === "valid" && normalized.value === row.date;
}

function hasCanonicalAmount(row) {
    if (row.amountStatus === "missing" || row.amountStatus === "invalid") {
        return row.amount === null;
    }

    if (!hasValidAmount(row) || typeof row.amount !== "string") {
        return false;
    }

    const normalized = normalizeAmount(row.amount, AMOUNT_FORMATS.DOT);
    return normalized.status === row.amountStatus && normalized.value === row.amount;
}

function toDiagnosticUnits(value) {
    if (typeof value !== "string" || !CANONICAL_DIAGNOSTIC.test(value)) {
        return null;
    }

    const [integer, fraction = ""] = value.split(".");
    return BigInt(integer) * DIAGNOSTIC_SCALE + BigInt(fraction.padEnd(9, "0"));
}

/**
 * Return matching record numbers for consistent diagnostics, or null when
 * the diagnostics contradict the prepared data or the stored IQR rules.
 * This check uses the saved quartiles and never sorts the amounts.
 */
function checkOutlierDiagnostics(preparedRows, diagnostics) {
    if (!isObject(diagnostics)) return null;

    const eligibleRows = preparedRows.filter((row) => row.amountStatus === "valid");
    const { status, reason, eligibleCount, q1, q3, iqr, upperThreshold } = diagnostics;

    if (eligibleCount !== eligibleRows.length) return null;

    if (eligibleCount < IQR_MIN_SAMPLE_SIZE) {
        const consistent =
            status === "unavailable" &&
            reason === "insufficient_sample" &&
            q1 === null &&
            q3 === null &&
            iqr === null &&
            upperThreshold === null;

        return consistent ? [] : null;
    }

    const q1Units = toDiagnosticUnits(q1);
    const q3Units = toDiagnosticUnits(q3);
    const iqrUnits = toDiagnosticUnits(iqr);

    if (
        q1Units === null ||
        q3Units === null ||
        iqrUnits === null ||
        q3Units - q1Units !== iqrUnits
    ) {
        return null;
    }

    if (iqrUnits === 0n) {
        const consistent =
            status === "unavailable" && reason === "zero_iqr" && upperThreshold === null;

        return consistent ? [] : null;
    }

    const thresholdUnits = toDiagnosticUnits(upperThreshold);

    if (
        status !== "available" ||
        reason !== null ||
        thresholdUnits === null ||
        2n * (thresholdUnits - q3Units) !== 3n * iqrUnits
    ) {
        return null;
    }

    const recordNumbers = [];

    for (const row of eligibleRows) {
        if (toDiagnosticUnits(row.amount) > thresholdUnits) {
            recordNumbers.push(row.recordNumber);
        }
    }

    return recordNumbers;
}

function countReportValues(rows, mapping) {
    const counts = {
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
        missingCustomerIds: 0
    };

    for (const row of rows) {
        const validDate = row.dateStatus === "valid";
        const validAmount = hasValidAmount(row);

        if (validDate) counts.validDateRows++;
        if (validAmount) counts.validAmountRows++;
        if (validDate && validAmount) counts.validSalesRows++;
        if (row.dateStatus === "missing") counts.missingDates++;
        if (row.dateStatus === "invalid") counts.invalidDates++;
        if (row.amountStatus === "missing") counts.missingAmounts++;
        if (row.amountStatus === "invalid") counts.invalidAmounts++;
        if (row.amountStatus === "negative") counts.negativeAmounts++;
        if (row.amountStatus === "valid" && row.amount === "0") counts.zeroAmounts++;
        if (mapping.customerId && row.customerId === null) counts.missingCustomerIds++;
    }

    return counts;
}

export function checkPreparedDatasetIntegrity(sourceRows, mapping, result) {
    const violations = [];

    function addViolation(code, field = null, recordNumber = null) {
        violations.push({ code, recordNumber, field });
    }

    function finish() {
        return { status: violations.length === 0 ? "passed" : "failed", violations };
    }

    if (!Array.isArray(sourceRows) || !isObject(mapping) || !Array.isArray(result?.preparedRows)) {
        addViolation("INVALID_INTEGRITY_INPUT");
        return finish();
    }

    const { preparedRows, report, issues, outlierAnalysis, analysisEligibility } = result;

    if (sourceRows.length !== preparedRows.length || preparedRows.length !== report?.totalRows) {
        addViolation("ROW_COUNT_MISMATCH", "totalRows");
    }

    let rowsUsable = true;
    let amountsCanonical = true;

    for (let index = 0; index < preparedRows.length; index++) {
        const row = preparedRows[index];
        const sourceRow = sourceRows[index];
        const recordNumber = index + 1;

        if (!isObject(row)) {
            addViolation("INVALID_PREPARED_ROW", null, recordNumber);
            rowsUsable = false;
            continue;
        }

        if (row.recordNumber !== recordNumber) {
            addViolation("RECORD_NUMBER_MISMATCH", "recordNumber", recordNumber);
        }

        if (!hasCanonicalDate(row)) {
            addViolation("NON_CANONICAL_DATE", "date", recordNumber);
        }

        if (!hasCanonicalAmount(row)) {
            addViolation("NON_CANONICAL_AMOUNT", "amount", recordNumber);
            amountsCanonical = false;
        }

        if (row.validForSales !== (row.dateStatus === "valid" && hasValidAmount(row))) {
            addViolation("VALID_FOR_SALES_MISMATCH", "validForSales", recordNumber);
        }

        if (index < sourceRows.length && !isObject(sourceRow)) {
            addViolation("INVALID_SOURCE_ROW", null, recordNumber);
        }

        if (isObject(sourceRow)) {
            for (const field of OPTIONAL_FIELDS) {
                if (row[field] !== normalizeOptionalText(sourceRow, mapping[field])) {
                    addViolation("OPTIONAL_VALUE_MISMATCH", field, recordNumber);
                }
            }
        }
    }

    if (!rowsUsable) return finish();

    const expectedCounters = countReportValues(preparedRows, mapping);

    if (amountsCanonical) {
        const outlierRecordNumbers = checkOutlierDiagnostics(preparedRows, outlierAnalysis);

        if (outlierRecordNumbers === null) {
            addViolation("OUTLIER_ANALYSIS_MISMATCH", "outlierAnalysis");
        } else {
            expectedCounters.highValueOutlierCount = outlierRecordNumbers.length;

            if (
                !sameData(
                    issues,
                    buildPreparationIssues(preparedRows, mapping, outlierRecordNumbers)
                )
            ) {
                addViolation("ISSUE_MISMATCH", "issues");
            }
        }
    }

    for (const [field, expected] of Object.entries(expectedCounters)) {
        if (report?.[field] !== expected) {
            addViolation("REPORT_COUNTER_MISMATCH", field);
        }
    }

    const expectedEligibility = buildAnalysisEligibility(preparedRows, mapping);

    for (const [operation, expected] of Object.entries(expectedEligibility)) {
        if (!sameData(analysisEligibility?.[operation], expected)) {
            addViolation("ELIGIBILITY_MISMATCH", operation);
        }
    }

    return finish();
}
