import { useState } from "react";
import { detectColumnMapping } from "../utils/columnMapping";

const FIELDS = [
    { key: "date", label: "Transaction Date", required: true },
    { key: "amount", label: "Sales Amount", required: true },
    { key: "customerId", label: "Customer ID", required: false },
    { key: "orderId", label: "Order ID", required: false },
    { key: "category", label: "Product Category", required: false }
];

export default function ColumnMapping({ columns, onConfirm, onMappingChange, processing = false }) {
    const [mapping, setMapping] = useState(() => detectColumnMapping(columns));

    // Update a selected CSV column
    // Update the selected column and invalidate previous confirmation
    function handleMappingChange(field, value) {
        setMapping((previous) => ({
            ...previous,
            [field]: value
        }));

        onMappingChange();
    }

    const selectedColumns = Object.values(mapping).filter(Boolean);

    const hasDuplicates = new Set(selectedColumns).size !== selectedColumns.length;

    const missingRequired = !mapping.date || !mapping.amount;

    const isValid = !hasDuplicates && !missingRequired;

    // Confirm validated column mapping
    function handleConfirm() {
        if (!isValid) return;

        onConfirm(mapping);
    }

    return (
        <section className="column-mapping-card">
            <div className="column-mapping-header">
                <h2>Column Mapping</h2>
                <p>Review the automatically detected columns and correct them if necessary.</p>
            </div>

            <div className="column-mapping-grid">
                {FIELDS.map((field) => (
                    <div className="column-mapping-field" key={field.key}>
                        <label className="column-mapping-label" htmlFor={`mapping-${field.key}`}>
                            {field.label}

                            {field.required ? (
                                <span className="column-mapping-required"> *</span>
                            ) : (
                                <span className="column-mapping-optional"> (optional)</span>
                            )}
                        </label>

                        <select
                            className="column-mapping-select"
                            id={`mapping-${field.key}`}
                            value={mapping[field.key] || ""}
                            onChange={(event) => handleMappingChange(field.key, event.target.value)}
                            disabled={processing}
                        >
                            <option value="">Not selected</option>

                            {columns.map((column, index) => (
                                <option key={index} value={column}>
                                    {column}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
            </div>

            <div className="column-mapping-actions">
                <button
                    type="button"
                    className="upload-primary-button"
                    onClick={handleConfirm}
                    disabled={processing}
                >
                    {processing ? "Processing..." : "Confirm Mapping"}
                </button>
            </div>
        </section>
    );
}
