const MIN_SAMPLE_SIZE = 20;
const AMOUNT_DECIMAL_PLACES = 6;
const DIAGNOSTIC_DECIMAL_PLACES = 9;

// Convert a canonical nonnegative amount to integer millionths.
function toAmountUnits(amount) {
    const [integer, fraction = ""] = amount.split(".");
    return BigInt(integer + fraction.padEnd(AMOUNT_DECIMAL_PLACES, "0"));
}

// Return the R-7 quartile in quarters of a millionth.
function quartileInQuarterUnits(sortedUnits, numerator) {
    const rankNumerator = (sortedUnits.length - 1) * numerator;
    const index = Math.floor(rankNumerator / 4);
    const remainder = BigInt(rankNumerator % 4);
    const lower = sortedUnits[index];

    if (remainder === 0n) {
        return 4n * lower;
    }

    const upper = sortedUnits[index + 1];
    return 4n * lower + remainder * (upper - lower);
}

// One eighth of a millionth equals 125 billionths.
function formatEighthUnits(eighthUnits) {
    const digits = (eighthUnits * 125n).toString().padStart(DIAGNOSTIC_DECIMAL_PLACES + 1, "0");
    const integer = digits.slice(0, -DIAGNOSTIC_DECIMAL_PLACES);
    const fraction = digits.slice(-DIAGNOSTIC_DECIMAL_PLACES).replace(/0+$/, "");

    return fraction ? `${integer}.${fraction}` : integer;
}

/**
 * Analyze canonical amounts from validateDataset's prepared rows.
 * The analysis uses valid nonnegative amounts, including zero.
 * Returns serializable diagnostics and matching record numbers in input order.
 */
export function analyzeAmountOutliers(preparedRows) {
    const eligible = [];

    for (const row of preparedRows) {
        // The normalizer uses "negative" for valid amounts below zero.
        if (row.amountStatus === "valid") {
            eligible.push({
                recordNumber: row.recordNumber,
                units: toAmountUnits(row.amount)
            });
        }
    }

    const diagnostics = {
        status: "unavailable",
        reason: null,
        eligibleCount: eligible.length,
        q1: null,
        q3: null,
        iqr: null,
        upperThreshold: null
    };
    const outlierRecordNumbers = [];

    if (eligible.length < MIN_SAMPLE_SIZE) {
        diagnostics.reason = "insufficient_sample";
        return { diagnostics, outlierRecordNumbers };
    }

    const sortedUnits = eligible.map(({ units }) => units);
    sortedUnits.sort((left, right) => {
        if (left < right) return -1;
        if (left > right) return 1;
        return 0;
    });

    const q1x4 = quartileInQuarterUnits(sortedUnits, 1);
    const q3x4 = quartileInQuarterUnits(sortedUnits, 3);
    const iqrx4 = q3x4 - q1x4;

    diagnostics.q1 = formatEighthUnits(2n * q1x4);
    diagnostics.q3 = formatEighthUnits(2n * q3x4);
    diagnostics.iqr = formatEighthUnits(2n * iqrx4);

    if (iqrx4 === 0n) {
        diagnostics.reason = "zero_iqr";
        return { diagnostics, outlierRecordNumbers };
    }

    const upperThresholdx8 = 2n * q3x4 + 3n * iqrx4;
    diagnostics.status = "available";
    diagnostics.upperThreshold = formatEighthUnits(upperThresholdx8);

    for (const { recordNumber, units } of eligible) {
        if (8n * units > upperThresholdx8) {
            outlierRecordNumbers.push(recordNumber);
        }
    }

    return { diagnostics, outlierRecordNumbers };
}
