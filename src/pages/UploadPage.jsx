import FileUpload from "../components/upload/FileUpload";
import UploadStepper from "../components/upload/UploadStepper";
import CsvPreview from "../components/upload/CsvPreview";

import ColumnMapping from "../components/ColumnMapping";
import DataFormatSettings from "../components/DataFormatSettings";

import { useContext } from "react";
import { UploadContext } from "../context/UploadContext";

import "../css/Upload.css";

import { useNavigate } from "react-router-dom";

import Button from "../components/ui/Button";

// Build the CSV preparation wizard from reusable components
export default function UploadPage() {
    const navigate = useNavigate();

    const upload = useContext(UploadContext);

    const busy = upload.previewLoading || upload.processing;

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
                        selectedFile={upload.file}
                        onFileSelect={upload.handleFileSelect}
                        loading={upload.previewLoading}
                    />

                    {upload.previewLoading && <p role="status">Reading CSV file...</p>}

                    <CsvPreview columns={upload.columns} rows={upload.preview} />

                    <div className="upload-actions">
                        <Button
                            variant="primary"
                            showArrow
                            onClick={upload.handleContinueFromUpload}
                            disabled={!upload.file || !upload.columns.length || busy}
                            loading={upload.processing}
                        >
                            {upload.processing ? "Processing..." : "Continue to column mapping"}
                        </Button>
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
                        onBack={upload.handleBack}
                    />
                </div>
            )}

            {/* Step 3: Data format settings */}
            {upload.currentStep === 3 && upload.confirmedMapping && (
                <>
                    <DataFormatSettings
                        formats={upload.formats}
                        onChange={upload.handleFormatChange}
                        disabled={upload.processing}
                    />

                    <div className="upload-actions upload-actions--between">
                        <Button
                            variant="secondary"
                            arrow="left"
                            onClick={upload.handleBack}
                            disabled={upload.processing}
                        >
                            Back
                        </Button>

                        <Button
                            variant="primary"
                            arrow="right"
                            onClick={upload.handleValidateDataset}
                            disabled={
                                !upload.formats.date || !upload.formats.amount || upload.processing
                            }
                            loading={upload.processing}
                        >
                            {upload.processing ? "Validating..." : "Validate Data"}
                        </Button>
                    </div>
                </>
            )}

            {/* Step 4: Navigation */}
            {upload.currentStep === 4 && (
                <div className="upload-actions upload-actions--between">
                    <Button
                        variant="secondary"
                        arrow="left"
                        onClick={upload.handleBack}
                        disabled={busy}
                    >
                        Back
                    </Button>

                    <Button
                        variant="primary"
                        arrow="right"
                        onClick={() => navigate("/analysis")}
                        disabled={
                            busy ||
                            upload.validationResult?.integrity?.status !== "passed" ||
                            !Object.values(upload.validationResult?.analysisEligibility ?? {}).some(
                                (operation) => operation.status === "available"
                            )
                        }
                    >
                        Continue to Analysis
                    </Button>
                </div>
            )}
        </main>
    );
}
