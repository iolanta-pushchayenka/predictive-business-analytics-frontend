import Papa from "papaparse";

// Parse a CSV file using consistent parsing options
export function parseCsv(file, { previewRows = 0 } = {}) {
    return new Promise((resolve, reject) => {
        if (!Number.isInteger(previewRows) || previewRows < 0) {
            reject(new Error("Invalid preview row count"));
            return;
        }

        const options = {
            header: true,
            skipEmptyLines: true,

            complete: (results) => {
                if (results.errors.length > 0) {
                    const firstError = results.errors[0];

                    reject(new Error(
                        `CSV parsing error: ${firstError.message}`
                    ));
                    return;
                }

                const columns = results.meta.fields || [];

                if (columns.length === 0) {
                    reject(new Error("CSV has no columns"));
                    return;
                }

                if (results.data.length === 0 && previewRows === 0) {
                    reject(new Error("CSV contains no data rows"));
                    return;
                }

                resolve({
                    columns,
                    rows: results.data,
                    renamedHeaders: results.meta.renamedHeaders || null
                });
            },

            error: () => {
                reject(new Error("Failed to read CSV file"));
            }
        };

        if (previewRows > 0) {
            options.preview = previewRows;
        }

        Papa.parse(file, options);
    });
}
