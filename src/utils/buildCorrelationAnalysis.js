import { detectNumericColumns } from "./detectNumericColumns.js";
import { prepareCorrelationData } from "./prepareCorrelationData.js";
import { calculateCorrelationMatrix } from "./calculateCorrelationMatrix.js";

/**
 * Build correlation analysis from the original CSV data.
 * Detect numeric columns, prepare values and calculate Pearson correlations.
 */
export function buildCorrelationAnalysis({
    columns = [],
    rows = [],
    mapping = {},
    numberFormat = {}
} = {}) {
    const emptyResult = {
        status: "unavailable",
        reason: "insufficient_numeric_columns",
        columns: [],
        matrix: [],
        stats: {}
    };

    if (!Array.isArray(columns) || !Array.isArray(rows)) {
        return emptyResult;
    }

    // Step 1: Automatically detect numeric CSV columns.
    const numericColumns = detectNumericColumns(columns, rows, mapping);

    if (numericColumns.length < 2) {
        return {
            ...emptyResult,
            columns: numericColumns
        };
    }

    // Step 2: Normalize numeric values without removing source rows.
    const preparedData = prepareCorrelationData(rows, numericColumns, numberFormat);

    // Step 3: Calculate Pearson correlations for all column pairs.
    const result = calculateCorrelationMatrix(preparedData);

    // Check whether at least one correlation between different columns exists.
    const hasValidPair = result.matrix.some((matrixRow, rowIndex) =>
        matrixRow.some((cell, columnIndex) => rowIndex !== columnIndex && cell.value !== null)
    );

    return {
        status: hasValidPair ? "available" : "unavailable",
        reason: hasValidPair ? null : "insufficient_valid_pairs",
        columns: result.columns,
        matrix: result.matrix,
        stats: preparedData.stats
    };
}
