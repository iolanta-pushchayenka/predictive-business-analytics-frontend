import { useState } from "react";

// Display the CSV upload area and pass the selected file to the parent
export default function FileUpload({
    selectedFile,
    onFileSelect,
    maxFileSize = null,
    error = "",
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState("");

    // Validate the selected file before sending it to the parent
    function handleFile(file) {
        setLocalError("");

        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setLocalError("Please select a CSV file.");
            return;
        }

        if (maxFileSize !== null && file.size > maxFileSize) {
            setLocalError("The selected file exceeds the maximum allowed size.");
            return;
        }

        onFileSelect(file);
    }

    // Handle files selected through the file browser
    function handleInputChange(event) {
        const file = event.target.files?.[0];
        handleFile(file);

        // Allow selecting the same file again
        event.target.value = "";
    }

    // Allow files to be dropped into the upload area
    function handleDragOver(event) {
        event.preventDefault();
        setIsDragging(true);
    }

    // Handle a file dropped into the upload area
    function handleDrop(event) {
        event.preventDefault();
        setIsDragging(false);

        const file = event.dataTransfer.files?.[0];
        handleFile(file);
    }

    const displayedError = localError || error;

    return (
        <section className="upload-card">
            <div className="upload-header">
                <div>
                    <h2 className="upload-title">
                        Upload CSV file
                    </h2>

                    <p className="upload-description">
                        Select a file containing your business
                        transactions. You can review it before
                        anything is processed.
                    </p>
                </div>
            </div>

            <div
                className={`upload-dropzone ${
                    isDragging ? "upload-dropzone--active" : ""
                }`}
                onDragOver={handleDragOver}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
            >
                <div className="upload-icon" aria-hidden="true">
                    <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 16V3" />
                        <path d="m7 8 5-5 5 5" />
                        <path d="M4 16v4h16v-4" />
                    </svg>
                </div>

                <p className="upload-dropzone-title">
                    Drag and drop your CSV file here
                </p>

                <p className="upload-dropzone-description">
                    or choose a file from your device
                </p>

                <label className="upload-browse-button">
                    Browse files
                    <input
                        className="upload-file-input"
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleInputChange}
                        aria-label="Choose CSV file"
                    />
                </label>

                <p className="upload-file-hint">
                    CSV files only
                    {maxFileSize !== null &&
                        ` · Maximum file size ${Math.round(
                            maxFileSize / (1024 * 1024)
                        )} MB`}
                </p>
            </div>

            {selectedFile && (
                <div className="upload-selected-file" role="status">
                    <div className="upload-selected-file-info">
                        <span className="upload-file-icon" aria-hidden="true">
                            CSV
                        </span>

                        <div>
                            <p className="upload-file-name">
                                {selectedFile.name}
                            </p>

                            <p className="upload-file-size">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                        </div>
                    </div>

                    <span className="upload-file-success">
                        File selected
                    </span>
                </div>
            )}

            {displayedError && (
                <p className="upload-error" role="alert">
                    {displayedError}
                </p>
            )}
        </section>
    );
}