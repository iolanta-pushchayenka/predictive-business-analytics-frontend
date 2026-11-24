/**
 * Calculate a percentile from sorted numeric values.
 */
function percentile(sorted, p) {
    const position = (sorted.length - 1) * p;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);

    if (lower === upper) {
        return sorted[lower];
    }

    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

/**
 * Format histogram boundaries using compact numbers.
 */
function formatBoundary(value) {
    const absolute = Math.abs(value);

    if (absolute >= 1000) {
        return `${Number((value / 1000).toFixed(1))}k`;
    }

    return Number(value.toFixed(2)).toLocaleString("en-US");
}

/**
 * Calculate a sales histogram using Freedman-Diaconis bin width.
 * High-value outliers are displayed in a separate category.
 */
export function calculateSalesDistribution(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
        return [];
    }

    // Extract valid normalized sales amounts.
    const amounts = rows
        .map((row) => row.amount)
        .filter((amount) => amount !== null && amount !== undefined)
        .map(Number)
        .filter(Number.isFinite)
        .sort((a, b) => a - b);

    if (amounts.length === 0) {
        return [];
    }

    const q1 = percentile(amounts, 0.25);
    const q3 = percentile(amounts, 0.75);
    const iqr = q3 - q1;

    // Identify high-value outliers using the upper IQR fence.
    const upperFence = q3 + 1.5 * iqr;

    const regular = [];
    const outliers = [];

    for (const amount of amounts) {
        if (amount > upperFence) {
            outliers.push(amount);
        } else {
            regular.push(amount);
        }
    }

    if (regular.length === 0) {
        return [
            {
                range: "Outliers",
                count: outliers.length,
                min: amounts[0],
                max: amounts[amounts.length - 1]
            }
        ];
    }

    const min = regular[0];
    const max = regular[regular.length - 1];

    // Handle identical regular amounts.
    if (min === max) {
        const result = [
            {
                range: formatBoundary(min),
                min,
                max,
                count: regular.length
            }
        ];

        if (outliers.length > 0) {
            result.push({
                range: "Outliers",
                min: outliers[0],
                max: outliers[outliers.length - 1],
                count: outliers.length
            });
        }

        return result;
    }

    // Calculate Freedman-Diaconis bin width.
    const width = (2 * iqr) / Math.cbrt(regular.length);

    // Limit the main histogram to 5–15 intervals.
    const suggestedCount =
        width > 0 ? Math.ceil((max - min) / width) : Math.ceil(Math.sqrt(regular.length));

    const binCount = Math.max(5, Math.min(15, suggestedCount));

    const binWidth = (max - min) / binCount;

    // Create the main histogram intervals.
    const bins = Array.from({ length: binCount }, (_, index) => {
        const lower = min + index * binWidth;
        const upper = index === binCount - 1 ? max : min + (index + 1) * binWidth;

        return {
            range: `${formatBoundary(lower)}–${formatBoundary(upper)}`,
            axisLabel: formatBoundary(upper),
            min: lower,
            max: upper,
            count: 0
        };
    });

    // Count each regular sales amount exactly once.
    for (const amount of regular) {
        const index = Math.min(Math.floor((amount - min) / binWidth), binCount - 1);

        bins[index].count++;
    }

    // Preserve high-value outliers in a separate category.
    if (outliers.length > 0) {
        bins.push({
            range: "Outliers",
            min: outliers[0],
            max: outliers[outliers.length - 1],
            count: outliers.length
        });
    }

    return bins;
}
