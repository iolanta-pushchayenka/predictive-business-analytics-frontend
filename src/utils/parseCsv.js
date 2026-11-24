import Papa from "papaparse";

// Keep the parsed header names while validating trimmed names for ambiguity.
function validateHeaders(columns) {
    const seen = new Set();

    for (const [index, column] of columns.entries()) {
        const name = column.trim();

        if (!name) {
            throw new Error(`CSV header in column ${index + 1} is blank.`);
        }

        if (seen.has(name)) {
            throw new Error(`Duplicate CSV header: "${name}".`);
        }

        seen.add(name);
    }
}

// Papa accepts bare quotes inside unquoted fields. Check the raw field tokens.
function validateQuotes(record, delimiter) {
    let start = 0;
    while (start < record.length) {
        if (record[start] === '"') {
            let closing = record.indexOf('"', start + 1);
            while (closing !== -1 && record[closing + 1] === '"') {
                closing = record.indexOf('"', closing + 2);
            }
            if (closing === -1) {
                throw new Error("CSV parsing error: unterminated quoted field.");
            }
            start = closing + 1;
        }

        const separator = record.indexOf(delimiter, start);
        const end = separator === -1 ? record.length : separator;
        if (record.slice(start, end).includes('"')) {
            throw new Error("CSV parsing error: misplaced quote.");
        }
        start = end + 1;
    }
}

// Parse a CSV preview or full dataset using the same structural checks.
export async function parseCsv(file, { previewRows = 0 } = {}) {
    if (!Number.isInteger(previewRows) || previewRows < 0) {
        throw new Error("Invalid preview row count");
    }

    let source;
    try {
        source = typeof file === "string" ? file : await file.text();
    } catch {
        throw new Error("Failed to read CSV file");
    }

    source = source.replace(/^\uFEFF/, "");

    // Let Papa detect the dialect without letting blank lines skew its sample.
    const sample = Papa.parse(source.replace(/^[\r\n]+/, ""), {
        preview: 1,
        skipEmptyLines: true
    });
    const { delimiter, linebreak } = sample.meta;

    let columns;
    let cursor = 0;
    const rows = [];

    Papa.parse(source, {
        header: false,
        delimiter,
        newline: linebreak,
        skipEmptyLines: false,
        step({ data, errors, meta }, parser) {
            const start = cursor;
            cursor = meta.cursor;

            // A quoted empty value is a record. Only a bare line break or EOF is blank.
            if (
                data.length === 1 &&
                data[0] === "" &&
                (start === cursor || source.slice(start, cursor) === linebreak)
            ) {
                return;
            }

            if (errors.length > 0) {
                throw new Error(`CSV parsing error: ${errors[0].message}`);
            }

            const raw = source.slice(start, cursor);
            if (raw.includes('"')) {
                const record = raw.endsWith(linebreak) ? raw.slice(0, -linebreak.length) : raw;
                validateQuotes(record, delimiter);
            }

            if (!columns) {
                validateHeaders(data);
                columns = data;
                return;
            }

            if (data.length !== columns.length) {
                throw new Error(
                    `CSV record ${rows.length + 1} has ${data.length} fields. Expected ${columns.length}.`
                );
            }

            rows.push(Object.fromEntries(columns.map((column, index) => [column, data[index]])));

            if (previewRows > 0 && rows.length === previewRows) {
                parser.abort();
            }
        }
    });

    if (!columns) {
        throw new Error("CSV is empty or has no header row.");
    }

    if (rows.length === 0) {
        throw new Error("CSV contains no data rows.");
    }

    if (columns.length < 2) {
        throw new Error("CSV must contain at least two columns. Check the header and delimiter.");
    }

    return {
        columns,
        rows,
        renamedHeaders: null,
        meta: { delimiter, linebreak, truncated: cursor < source.length },
        structuralDiagnostics: []
    };
}
