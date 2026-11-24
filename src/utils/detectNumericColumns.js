const MIN_NUMERIC_RATIO = 0.9;
const MIN_VALID_VALUES = 3;
const SAMPLE_SIZE = 200;

// Check whether a column name represents an identifier or code.
function isIdentifierColumn(name) {
    return /(^|[\s_-])(id|code|sku|zip|postal|phone|barcode|index)([\s_-]|$)/i.test(name);
}

// Check whether a value has a recognizable numeric structure.
function looksNumeric(value) {
    if (typeof value === "number") {
        return Number.isFinite(value);
    }

    if (typeof value !== "string") {
        return false;
    }

    const text = value.trim();

    if (!text) return false;

    // Accept basic decimal and grouped number representations.
    return /^[+-]?(?:\d+(?:[.,]\d+)*|\d{1,3}(?:[ .]\d{3})+(?:[.,]\d+)?)$/.test(text);
}

// Check whether a CSV value is missing.
function isMissing(value) {
    return value === null || value === undefined || String(value).trim() === "";
}

// Select a bounded sample distributed across the dataset.
function sampleRows(rows) {
    if (rows.length <= SAMPLE_SIZE) {
        return rows;
    }

    return Array.from({ length: SAMPLE_SIZE }, (_, index) => {
        const position = Math.floor((index * (rows.length - 1)) / (SAMPLE_SIZE - 1));

        return rows[position];
    });
}

/**
 * Detect candidate numeric CSV columns for correlation analysis.
 * This step identifies columns; normalization happens separately.
 */
export function detectNumericColumns(columns, rows, mapping = {}) {
    if (!Array.isArray(columns) || !Array.isArray(rows)) {
        return [];
    }

    const excludedColumns = new Set(
        [mapping.date, mapping.customerId, mapping.orderId, mapping.category].filter(Boolean)
    );

    const sample = sampleRows(rows);
    const detected = [];

    // Check each CSV column independently.
    for (const column of columns) {
        if (excludedColumns.has(column)) continue;
        if (isIdentifierColumn(column)) continue;

        let nonMissing = 0;
        let numericCount = 0;

        const distinctValues = new Set();

        // Evaluate numeric consistency within the sample.
        for (const row of sample) {
            const value = row[column];

            if (isMissing(value)) continue;

            nonMissing++;

            if (looksNumeric(value)) {
                numericCount++;
                distinctValues.add(String(value).trim());
            }
        }

        if (nonMissing < MIN_VALID_VALUES) continue;

        const numericRatio = numericCount / nonMissing;

        // Keep columns with sufficient valid numeric values and variation.
        if (
            numericCount >= MIN_VALID_VALUES &&
            numericRatio >= MIN_NUMERIC_RATIO &&
            distinctValues.size >= 2
        ) {
            detected.push(column);
        }
    }

    return detected;
}
