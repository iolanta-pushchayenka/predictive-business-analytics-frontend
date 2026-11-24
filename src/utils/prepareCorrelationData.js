/**
 * Convert a CSV value to a finite number.
 * Return null for missing, invalid or ambiguous values.
 */
export function parseCorrelationNumber(value, options = {}) {
    const { decimalSeparator = ".", thousandsSeparator = "," } = options;

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : null;
    }

    if (typeof value !== "string") return null;

    let text = value.trim();

    if (!text) return null;

    if (
        ![".", ","].includes(decimalSeparator) ||
        decimalSeparator === thousandsSeparator ||
        ![",", ".", " ", ""].includes(thousandsSeparator)
    ) {
        return null;
    }

    // Validate the complete numeric structure before conversion.
    const escapedDecimal = decimalSeparator === "." ? "\\." : ",";
    const escapedThousands =
        thousandsSeparator === "." ? "\\." : thousandsSeparator === " " ? " " : thousandsSeparator;

    const plainPattern = new RegExp(`^[+-]?\\d+(?:${escapedDecimal}\\d+)?$`);

    const groupedPattern = thousandsSeparator
        ? new RegExp(`^[+-]?\\d{1,3}(?:${escapedThousands}\\d{3})+(?:${escapedDecimal}\\d+)?$`)
        : null;

    if (!plainPattern.test(text) && !(groupedPattern && groupedPattern.test(text))) {
        return null;
    }

    // Remove thousands separators and normalize the decimal separator.
    if (thousandsSeparator) {
        text = text.split(thousandsSeparator).join("");
    }

    if (decimalSeparator === ",") {
        text = text.replace(",", ".");
    }

    const number = Number(text);

    return Number.isFinite(number) ? number : null;
}

/**
 * Prepare aligned numeric values for correlation analysis.
 * Preserve all original rows and represent invalid values as null.
 */
export function prepareCorrelationData(rows, numericColumns, options = {}) {
    if (!Array.isArray(rows) || !Array.isArray(numericColumns)) {
        return {
            columns: [],
            rows: [],
            stats: {}
        };
    }

    const columns = [...new Set(numericColumns)];

    const stats = Object.fromEntries(
        columns.map((column) => [
            column,
            {
                valid: 0,
                missing: 0,
                invalid: 0
            }
        ])
    );

    // Convert each selected column without changing row order.
    const preparedRows = rows.map((row, index) => {
        const values = {};

        for (const column of columns) {
            const rawValue = row?.[column];

            const isMissing =
                rawValue === null || rawValue === undefined || String(rawValue).trim() === "";

            const parsed = parseCorrelationNumber(rawValue, options);

            values[column] = parsed;

            if (isMissing) {
                stats[column].missing++;
            } else if (parsed === null) {
                stats[column].invalid++;
            } else {
                stats[column].valid++;
            }
        }

        return {
            sourceRowIndex: index,
            values
        };
    });

    return {
        columns,
        rows: preparedRows,
        stats
    };
}
