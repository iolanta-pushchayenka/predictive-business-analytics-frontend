const MIN_PAIR_COUNT = 3;

/**
 * Calculate Pearson correlation for two numeric arrays.
 * Return null if correlation cannot be calculated.
 */
function calculatePearson(xValues, yValues) {
    const count = xValues.length;

    if (count < MIN_PAIR_COUNT) {
        return null;
    }

    const meanX = xValues.reduce((sum, value) => sum + value, 0) / count;
    const meanY = yValues.reduce((sum, value) => sum + value, 0) / count;

    let numerator = 0;
    let sumSquaredX = 0;
    let sumSquaredY = 0;

    // Calculate deviations from the mean.
    for (let index = 0; index < count; index++) {
        const dx = xValues[index] - meanX;
        const dy = yValues[index] - meanY;

        numerator += dx * dy;
        sumSquaredX += dx * dx;
        sumSquaredY += dy * dy;
    }

    // Correlation is undefined for constant values.
    if (sumSquaredX === 0 || sumSquaredY === 0) {
        return null;
    }

    const denominator = Math.sqrt(sumSquaredX) * Math.sqrt(sumSquaredY);
    const correlation = numerator / denominator;

    if (!Number.isFinite(correlation)) {
        return null;
    }

    // Correct insignificant floating-point deviations outside [-1, 1].
    return Math.max(-1, Math.min(1, correlation));
}

/**
 * Calculate a correlation matrix from aligned prepared CSV rows.
 * Only rows with valid values for both columns are used per pair.
 */
export function calculateCorrelationMatrix(preparedData) {
    const columns = preparedData?.columns ?? [];
    const rows = preparedData?.rows ?? [];

    if (!Array.isArray(columns) || !Array.isArray(rows)) {
        return {
            columns: [],
            matrix: []
        };
    }

    const matrix = columns.map((columnX) => {
        return columns.map((columnY) => {
            const xValues = [];
            const yValues = [];

            // Collect valid pairs while preserving original row alignment.
            for (const row of rows) {
                const x = row.values?.[columnX];
                const y = row.values?.[columnY];

                if (
                    typeof x === "number" &&
                    Number.isFinite(x) &&
                    typeof y === "number" &&
                    Number.isFinite(y)
                ) {
                    xValues.push(x);
                    yValues.push(y);
                }
            }

            return {
                x: columnX,
                y: columnY,
                value: calculatePearson(xValues, yValues),
                pairCount: xValues.length
            };
        });
    });

    return {
        columns,
        matrix
    };
}
