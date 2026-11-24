// import { useRef, useState } from "react";
// import { parseCsv } from "../utils/parseCsv.js";
// import { profileDataset } from "../utils/profileDataset.js";
// import { validateDataset, validateMapping } from "../utils/validateDataset.js";

// const initialFormats = {
//     date: "",
//     amount: "",
//     twoDigitYearCentury: 2000
// };

// // Manage CSV preparation state and wizard navigation
// export function useCsvUpload() {
//     const [currentStep, setCurrentStep] = useState(1);

//     const [file, setFile] = useState(null);
//     const [columns, setColumns] = useState([]);
//     const [preview, setPreview] = useState([]);
//     const [error, setError] = useState("");

//     const [confirmedMapping, setConfirmedMapping] = useState(null);
//     const [fullDataset, setFullDataset] = useState(null);
//     const [initialProfile, setInitialProfile] = useState(null);
//     const fullRows = fullDataset?.rows ?? [];

//     const [previewLoading, setPreviewLoading] = useState(false);
//     const [processing, setProcessing] = useState(false);

//     const [fileVersion, setFileVersion] = useState(0);
//     const [formats, setFormats] = useState({ ...initialFormats });
//     const [validationResult, setValidationResult] = useState(null);

//     // Track the most recent CSV parsing operation
//     const operationIdRef = useRef(0);

//     // Prevent simultaneous full parsing operations
//     const processingRef = useRef(false);

//     // Select a CSV file and load its first five rows
//     async function handleFileSelect(selectedFile) {
//         const operationId = ++operationIdRef.current;

//         processingRef.current = false;

//         setFileVersion((version) => version + 1);
//         setCurrentStep(1);

//         setFile(null);
//         setColumns([]);
//         setPreview([]);
//         setError("");

//         setConfirmedMapping(null);
//         setFullDataset(null);
//         setInitialProfile(null);

//         setPreviewLoading(false);
//         setProcessing(false);

//         setFormats({ ...initialFormats });
//         setValidationResult(null);

//         if (!selectedFile) return;

//         if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
//             setError("Please select a CSV file.");
//             return;
//         }

//         if (selectedFile.size === 0) {
//             setError("The selected file is empty.");
//             return;
//         }

//         setPreviewLoading(true);

//         try {
//             const result = await parseCsv(selectedFile, {
//                 previewRows: 5
//             });

//             // Ignore results from an outdated operation
//             if (operationId !== operationIdRef.current) return;

//             setFile(selectedFile);
//             setColumns(result.columns);
//             setPreview(result.rows);
//         } catch (err) {
//             if (operationId !== operationIdRef.current) return;

//             setError(err.message || "Failed to read CSV file.");
//         } finally {
//             if (operationId === operationIdRef.current) {
//                 setPreviewLoading(false);
//             }
//         }
//     }

//     // Validate the entire file before entering mapping and reuse a successful parse.
//     async function handleContinueFromUpload() {
//         if (!file || previewLoading || processingRef.current) return;

//         setError("");
//         if (fullDataset) {
//             setCurrentStep(2);
//             return;
//         }

//         const operationId = ++operationIdRef.current;
//         processingRef.current = true;
//         setProcessing(true);

//         try {
//             const result = await parseCsv(file);
//             if (operationId !== operationIdRef.current) return;

//             setFullDataset(result);
//             setColumns(result.columns);
//             setPreview(result.rows.slice(0, 5));
//             setCurrentStep(2);
//         } catch (err) {
//             if (operationId !== operationIdRef.current) return;

//             setError(err.message || "Failed to process CSV.");
//         } finally {
//             if (operationId === operationIdRef.current) {
//                 processingRef.current = false;
//                 setProcessing(false);
//             }
//         }
//     }

//     // Profile the full parsed dataset after validating the selected mapping.
//     function handleMappingConfirm(mapping) {
//         if (!fullDataset) return;

//         setError("");
//         try {
//             validateMapping(fullDataset.columns, mapping);
//             setInitialProfile(profileDataset(fullDataset.rows, fullDataset.columns, mapping));
//             setConfirmedMapping(mapping);
//             setValidationResult(null);
//             setCurrentStep(3);
//         } catch (err) {
//             setError(err.message || "Failed to profile CSV.");
//         }
//     }

//     // Invalidate mapping-dependent results while retaining parsed data.
//     function handleMappingChange() {
//         setConfirmedMapping(null);
//         setInitialProfile(null);
//         setValidationResult(null);
//         setError("");
//     }

//     // Update data formats and invalidate previous validation
//     function handleFormatChange(nextFormats) {
//         setFormats(nextFormats);
//         setValidationResult(null);
//         setError("");
//     }

//     // Validate the complete dataset using confirmed settings
//     function handleValidateDataset() {
//         if (
//             !confirmedMapping ||
//             !fullRows.length ||
//             !formats.date ||
//             !formats.amount ||
//             processing
//         ) {
//             return;
//         }

//         setError("");
//         setValidationResult(null);

//         try {
//             const result = validateDataset(
//                 fullRows,
//                 fullDataset.columns,
//                 confirmedMapping,
//                 formats
//             );

//             setValidationResult(result);
//             setCurrentStep(4);
//         } catch (err) {
//             setError(err.message || "Failed to validate dataset.");
//         }
//     }

//     // Navigate to the previous preparation step
//     function handleBack() {
//         if (processing || previewLoading || currentStep <= 1) {
//             return;
//         }

//         setError("");
//         setCurrentStep((step) => step - 1);
//     }

//     return {
//         currentStep,
//         file,
//         columns,
//         preview,
//         error,
//         confirmedMapping,
//         fullRows,
//         initialProfile,
//         previewLoading,
//         processing,
//         fileVersion,
//         formats,
//         validationResult,

//         handleFileSelect,
//         handleContinueFromUpload,
//         handleMappingConfirm,
//         handleMappingChange,
//         handleFormatChange,
//         handleValidateDataset,
//         handleBack
//     };
// }

import { useRef, useState } from "react";
import { useAnalysisWorker } from "./useAnalysisWorker.js";

const initialFormats = {
    date: "",
    amount: "",
    twoDigitYearCentury: 2000
};

// Manage the CSV Wizard and delegate processing to Web Worker.
export function useCsvUpload() {
    const { runTask, cancelAll } = useAnalysisWorker();

    const [currentStep, setCurrentStep] = useState(1);
    const [file, setFile] = useState(null);
    const [columns, setColumns] = useState([]);
    const [preview, setPreview] = useState([]);
    const [error, setError] = useState("");

    const [confirmedMapping, setConfirmedMapping] = useState(null);
    const [fullDataset, setFullDataset] = useState(null);
    const [initialProfile, setInitialProfile] = useState(null);

    const fullRows = fullDataset?.rows ?? [];

    const [previewLoading, setPreviewLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [fileVersion, setFileVersion] = useState(0);
    const [formats, setFormats] = useState({ ...initialFormats });
    const [validationResult, setValidationResult] = useState(null);

    const operationIdRef = useRef(0);
    const processingRef = useRef(false);

    // Select a new CSV and request the first five rows.
    async function handleFileSelect(selectedFile) {
        const operationId = ++operationIdRef.current;

        // Stop processing the previously selected dataset.
        cancelAll();
        processingRef.current = false;

        setFileVersion((version) => version + 1);
        setCurrentStep(1);
        setFile(null);
        setColumns([]);
        setPreview([]);
        setError("");
        setConfirmedMapping(null);
        setFullDataset(null);
        setInitialProfile(null);
        setPreviewLoading(false);
        setProcessing(false);
        setFormats({ ...initialFormats });
        setValidationResult(null);

        if (!selectedFile) return;

        if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
            setError("Please select a CSV file.");
            return;
        }

        if (selectedFile.size === 0) {
            setError("The selected file is empty.");
            return;
        }

        setPreviewLoading(true);

        try {
            const { result } = await runTask("PARSE_PREVIEW", {
                file: selectedFile
            });

            // Ignore results belonging to an older upload.
            if (operationId !== operationIdRef.current) return;

            setFile(selectedFile);
            setColumns(result.columns);
            setPreview(result.rows);
        } catch (err) {
            if (operationId !== operationIdRef.current) return;
            if (err.name === "AbortError") return;

            setError(err.message || "Failed to read CSV file.");
        } finally {
            if (operationId === operationIdRef.current) {
                setPreviewLoading(false);
            }
        }
    }

    // Parse the complete CSV before opening Column Mapping.
    async function handleContinueFromUpload() {
        if (!file || previewLoading || processingRef.current) {
            return;
        }

        setError("");

        if (fullDataset) {
            setCurrentStep(2);
            return;
        }

        const operationId = ++operationIdRef.current;

        processingRef.current = true;
        setProcessing(true);

        try {
            const { result } = await runTask("PARSE_FULL", {
                file
            });

            if (operationId !== operationIdRef.current) return;

            setFullDataset(result);
            setColumns(result.columns);
            setPreview(result.rows.slice(0, 5));
            setCurrentStep(2);
        } catch (err) {
            if (operationId !== operationIdRef.current) return;
            if (err.name === "AbortError") return;

            setError(err.message || "Failed to process CSV.");
        } finally {
            if (operationId === operationIdRef.current) {
                processingRef.current = false;
                setProcessing(false);
            }
        }
    }

    // Validate column mapping and profile the dataset in Worker.
    async function handleMappingConfirm(mapping) {
        if (!fullDataset || processingRef.current) return;

        const operationId = ++operationIdRef.current;

        setError("");
        processingRef.current = true;
        setProcessing(true);

        try {
            const { result } = await runTask("PROFILE_DATASET", {
                rows: fullDataset.rows,
                columns: fullDataset.columns,
                mapping
            });

            if (operationId !== operationIdRef.current) return;

            setInitialProfile(result);
            setConfirmedMapping(mapping);
            setValidationResult(null);
            setCurrentStep(3);
        } catch (err) {
            if (operationId !== operationIdRef.current) return;
            if (err.name === "AbortError") return;

            setError(err.message || "Failed to profile CSV.");
        } finally {
            if (operationId === operationIdRef.current) {
                processingRef.current = false;
                setProcessing(false);
            }
        }
    }

    // Reset profiling when the user edits column mapping.
    function handleMappingChange() {
        ++operationIdRef.current;
        cancelAll();

        processingRef.current = false;
        setProcessing(false);
        setConfirmedMapping(null);
        setInitialProfile(null);
        setValidationResult(null);
        setError("");
    }

    // Update selected date and amount formats.
    function handleFormatChange(nextFormats) {
        // Invalidate a validation task started with older formats.
        if (processingRef.current) {
            ++operationIdRef.current;
            cancelAll();
            processingRef.current = false;
            setProcessing(false);
        }

        setFormats(nextFormats);
        setValidationResult(null);
        setError("");
    }

    // Normalize and validate the dataset inside Worker.
    async function handleValidateDataset() {
        if (
            !confirmedMapping ||
            !fullRows.length ||
            !formats.date ||
            !formats.amount ||
            processingRef.current
        ) {
            return;
        }

        const operationId = ++operationIdRef.current;

        setError("");
        setValidationResult(null);
        processingRef.current = true;
        setProcessing(true);

        try {
            const { result } = await runTask("VALIDATE_DATASET", {
                rows: fullRows,
                columns: fullDataset.columns,
                mapping: confirmedMapping,
                formats
            });

            if (operationId !== operationIdRef.current) return;

            setValidationResult(result);
            setCurrentStep(4);
        } catch (err) {
            if (operationId !== operationIdRef.current) return;
            if (err.name === "AbortError") return;

            setError(err.message || "Failed to validate dataset.");
        } finally {
            if (operationId === operationIdRef.current) {
                processingRef.current = false;
                setProcessing(false);
            }
        }
    }

    // Return to the previous CSV Wizard step.
    function handleBack() {
        if (processingRef.current || previewLoading || currentStep <= 1) {
            return;
        }

        setError("");
        setCurrentStep((step) => step - 1);
    }

    return {
        currentStep,
        file,
        columns,
        preview,
        error,
        confirmedMapping,
        fullRows,
        initialProfile,
        previewLoading,
        processing,
        fileVersion,
        formats,
        validationResult,

        // Share the same Worker with AnalysisPage.
        runTask,
        cancelAll,

        handleFileSelect,
        handleContinueFromUpload,
        handleMappingConfirm,
        handleMappingChange,
        handleFormatChange,
        handleValidateDataset,
        handleBack
    };
}
