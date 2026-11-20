import FileUpload from "../components/upload/FileUpload";
import UploadStepper from "../components/upload/UploadStepper";
import CsvPreview from "../components/upload/CsvPreview";
import ValidationSummary from "../components/upload/ValidationSummary";
import { getAnalysisReadiness } from "../components/upload/validationReportPresentation.js";

import ColumnMapping from "../components/ColumnMapping";
import DataFormatSettings from "../components/DataFormatSettings";

import { useCsvUpload } from "../hooks/useCsvUpload";

import "../css/Upload.css";

// Build the CSV preparation wizard from reusable components
export default function UploadPage() {
    const upload = useCsvUpload();

    const busy = upload.previewLoading || upload.processing;
    const readiness = getAnalysisReadiness({
        currentStep: upload.currentStep,
        validationResult: upload.validationResult,
        busy
    });

    return (
        <main className="upload-page">
            <UploadStepper currentStep={upload.currentStep} />

            {upload.error && (
                <p className="file-upload-error" role="alert">
                    {upload.error}
                </p>
            )}

            {/* Step 1: Upload and preview CSV */}
            {upload.currentStep === 1 && (
                <>
                    <FileUpload
                        file={upload.file}
                        onFileSelect={upload.handleFileSelect}
                        loading={upload.previewLoading}
                    />

                    {upload.previewLoading && <p role="status">Reading CSV file...</p>}

                    <CsvPreview columns={upload.columns} rows={upload.preview} />

                    <div className="upload-actions">
                        <button
                            className="upload-primary-button"
                            type="button"
                            onClick={upload.handleContinueFromUpload}
                            disabled={
                                !upload.file || !upload.columns.length || upload.previewLoading
                            }
                        >
                            Continue
                        </button>
                    </div>
                </>
            )}

            {/* Step 2: Column mapping */}
            {upload.file && upload.currentStep >= 2 && (
                <div hidden={upload.currentStep !== 2}>
                    <ColumnMapping
                        key={upload.fileVersion}
                        columns={upload.columns}
                        onConfirm={upload.handleMappingConfirm}
                        onMappingChange={upload.handleMappingChange}
                        processing={upload.processing}
                    />
                </div>
            )}

            {/* Step 3: Data format settings */}
            {upload.currentStep === 3 && upload.confirmedMapping && (
                <section className="upload-step-card">
                    <p className="upload-step-description">
                        Your CSV file contains {upload.fullRows.length} rows. Specify the formats
                        used in your dataset.
                    </p>

                    <DataFormatSettings
                        formats={upload.formats}
                        onChange={upload.handleFormatChange}
                    />

                    <div className="upload-actions">
                        <button
                            className="upload-primary-button"
                            type="button"
                            onClick={upload.handleValidateDataset}
                            disabled={
                                !upload.formats.date || !upload.formats.amount || upload.processing
                            }
                        >
                            Validate Dataset
                        </button>
                    </div>
                </section>
            )}

            {/* Step 4: Data quality report */}
            {upload.currentStep === 4 && (
                <ValidationSummary
                    validationResult={upload.validationResult}
                    initialProfile={upload.initialProfile}
                    confirmedMapping={upload.confirmedMapping}
                    readiness={readiness}
                    busy={busy}
                />
            )}
        </main>
    );
}
