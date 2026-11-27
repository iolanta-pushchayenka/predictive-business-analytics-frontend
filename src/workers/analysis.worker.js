import {
    parseCsv,
    calculateEda,
    profileDataset,
    validateMapping,
    validateDataset
} from "analytics-core";

// Execute a supported analysis task inside the Web Worker.
async function executeTask(type, payload) {
    console.count(`[Worker task] ${type}`);
    switch (type) {
        case "PARSE_PREVIEW":
            return parseCsv(payload.file, { previewRows: 5 });

        case "PARSE_FULL":
            return parseCsv(payload.file);

        case "PROFILE_DATASET": {
            const { rows, columns, mapping } = payload;

            // Check column mapping before profiling the dataset.
            validateMapping(columns, mapping);

            return profileDataset(rows, columns, mapping);
        }

        case "VALIDATE_DATASET": {
            const { rows, columns, mapping, formats } = payload;

            // Normalize, validate, and prepare analysis results.
            return validateDataset(rows, columns, mapping, formats);
        }

        case "CALCULATE_EDA":
            return calculateEda(payload);

        default:
            throw new Error(`Unknown analysis task: ${String(type)}`);
    }
}

// Receive tasks, execute them, and return results or errors.
self.onmessage = async (event) => {
    const { id, type, payload } = event.data ?? {};

    try {
        const startTime = performance.now();

        const result = await executeTask(type, payload);

        const computationMs = performance.now() - startTime;

        self.postMessage({
            id,
            type: "SUCCESS",
            result,
            metrics: {
                computationMs
            }
        });
    } catch (error) {
        self.postMessage({
            id,
            type: "ERROR",
            error: {
                message:
                    error instanceof Error
                        ? error.message
                        : "An unexpected analysis error occurred."
            }
        });
    }
};
