const OPTIONAL_FIELDS = new Set(["customerId", "orderId", "category"]);
const BUSINESS_FIELDS = ["date", "amount", ...OPTIONAL_FIELDS];

/**
 * Profile the raw rows using a confirmed mapping.
 * Returns { totalRows, totalColumns, unmappedColumnCount, mappedFields }.
 * Each mappedFields entry has { column, missingCount, nonemptyCount }; optional
 * fields also have distinctNonemptyCount. Unmapped fields have no entry.
 * Counts ignore surrounding whitespace and preserve case and leading zeros.
 */
export function profileDataset(rows, columns, mapping) {
    const mappedFields = {};

    for (const field of BUSINESS_FIELDS) {
        const column = mapping[field];
        if (!column) continue;

        let missingCount = 0;
        const distinct = OPTIONAL_FIELDS.has(field) ? new Set() : null;

        for (const row of rows) {
            const value = String(row[column] ?? "").trim();
            if (value === "") {
                missingCount++;
            } else {
                distinct?.add(value);
            }
        }

        mappedFields[field] = { column, missingCount, nonemptyCount: rows.length - missingCount };
        if (distinct) {
            mappedFields[field].distinctNonemptyCount = distinct.size;
        }
    }

    return {
        totalRows: rows.length,
        totalColumns: columns.length,
        unmappedColumnCount: columns.length - Object.keys(mappedFields).length,
        mappedFields
    };
}
