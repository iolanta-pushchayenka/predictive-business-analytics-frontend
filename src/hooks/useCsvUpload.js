import { useRef, useState } from "react";
import { parseCsv } from "../utils/parseCsv";
import { validateDataset } from "../utils/validateDataset";

const initialFormats = {
    date: "",
    amount: "",
    twoDigitYearCentury: 2000
};

// Manage CSV preparation state and wizard navigation
export function useCsvUpload() {
    const [currentStep, setCurrentStep] = useState(1);

    const [file, setFile] = useState(null);
    const [columns, setColumns] = useState([]);
    const [preview, setPreview] = useState([]);
    const [error, setError] = useState("");

    const [confirmedMapping, setConfirmedMapping] = useState(null);
    const [fullRows, setFullRows] = useState([]);

    const [previewLoading, setPreviewLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    const [fileVersion, setFileVersion] = useState(0);
    const [formats, setFormats] = useState({ ...initialFormats });
    const [validationResult, setValidationResult] = useState(null);

    // Track the most recent CSV parsing operation
    const operationIdRef = useRef(0);

    // Prevent simultaneous full parsing operations
    const processingRef = useRef(false);

    // Select a CSV file and load its first five rows
    async function handleFileSelect(selectedFile) {
        const operationId = ++operationIdRef.current;

        processingRef.current = false;

        setFileVersion((version) => version + 1);
        setCurrentStep(1);

        setFile(null);
        setColumns([]);
        setPreview([]);
        setError("");

        setConfirmedMapping(null);
        setFullRows([]);

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
            const result = await parseCsv(selectedFile, {
                previewRows: 5
            });

            // Ignore results from an outdated operation
            if (operationId !== operationIdRef.current) return;

            if (!result.columns.length) {
                throw new Error("No CSV columns were found.");
            }

            setFile(selectedFile);
            setColumns(result.columns);
            setPreview(result.rows);
        } catch (err) {
            if (operationId !== operationIdRef.current) return;

            setError(err.message || "Failed to read CSV file.");
        } finally {
            if (operationId === operationIdRef.current) {
                setPreviewLoading(false);
            }
        }
    }

    // Continue to column mapping after CSV preview is ready
    function handleContinueFromUpload() {
        if (!file || !columns.length || previewLoading) return;

        setError("");
        setCurrentStep(2);
    }

    // Confirm mapping and parse the complete CSV file
    async function handleMappingConfirm(mapping) {
        if (!file || processingRef.current) return;

        const operationId = ++operationIdRef.current;

        processingRef.current = true;

        setError("");
        setProcessing(true);

        setConfirmedMapping(null);
        setFullRows([]);
        setValidationResult(null);

        try {
            const result = await parseCsv(file);

            // Ignore outdated parsing results
            if (operationId !== operationIdRef.current) return;

            setFullRows(result.rows);
            setConfirmedMapping(mapping);
            setCurrentStep(3);
        } catch (err) {
            if (operationId !== operationIdRef.current) return;

            setError(err.message || "Failed to process CSV.");
        } finally {
            if (operationId === operationIdRef.current) {
                processingRef.current = false;
                setProcessing(false);
            }
        }
    }

    // Invalidate parsed data when the column mapping changes
    function handleMappingChange() {
        operationIdRef.current++;
        processingRef.current = false;

        setConfirmedMapping(null);
        setFullRows([]);
        setProcessing(false);

        setValidationResult(null);
        setError("");
    }

    // Update data formats and invalidate previous validation
    function handleFormatChange(nextFormats) {
        setFormats(nextFormats);
        setValidationResult(null);
        setError("");
    }

    // Validate the complete dataset using confirmed settings
    function handleValidateDataset() {
        if (
            !confirmedMapping ||
            !fullRows.length ||
            !formats.date ||
            !formats.amount ||
            processing
        ) {
            return;
        }

        setError("");
        setValidationResult(null);

        try {
            const result = validateDataset(fullRows, columns, confirmedMapping, formats);

            setValidationResult(result);
            setCurrentStep(4);
        } catch (err) {
            setError(err.message || "Failed to validate dataset.");
        }
    }

    // Navigate to the previous preparation step
    function handleBack() {
        if (processing || previewLoading || currentStep <= 1) {
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
        previewLoading,
        processing,
        fileVersion,
        formats,
        validationResult,

        handleFileSelect,
        handleContinueFromUpload,
        handleMappingConfirm,
        handleMappingChange,
        handleFormatChange,
        handleValidateDataset,
        handleBack
    };
}
