import { useState } from "react";
import { detectColumnMapping } from "../utils/columnMapping";
import Button from "./ui/Button";
import "./ColumnMapping.css";

const FIELDS = [
    { key: "date", label: "Transaction Date", required: true },
    { key: "amount", label: "Sales Amount", required: true },
    { key: "customerId", label: "Customer ID", required: false },
    { key: "orderId", label: "Order ID", required: false },
    { key: "category", label: "Product Category", required: false }
];

// Display and validate the CSV column mapping form.
export default function ColumnMapping({
    columns,
    onConfirm,
    onMappingChange,
    processing = false,
    onBack
}) {
    const [mapping, setMapping] = useState(() => detectColumnMapping(columns));

    // Update a selected column and invalidate previous confirmation.
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

    // Confirm the mapping when all required fields are valid.
    function handleConfirm() {
        if (!isValid || processing) return;

        onConfirm(mapping);
    }

    return (
        <div className="column-mapping">
            <section className="column-mapping-card" aria-labelledby="column-mapping-title">
                <div className="column-mapping-header">
                    <h2 id="column-mapping-title">Column Mapping</h2>

                    <p>Review the automatically detected columns and correct them if necessary.</p>
                </div>

                <div className="column-mapping-grid">
                    {FIELDS.map((field) => (
                        <div className="column-mapping-field" key={field.key}>
                            <label
                                className="column-mapping-label"
                                htmlFor={`mapping-${field.key}`}
                            >
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
                                onChange={(event) =>
                                    handleMappingChange(field.key, event.target.value)
                                }
                                disabled={processing}
                                required={field.required}
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

                {hasDuplicates && (
                    <p className="column-mapping-error" role="alert">
                        Each CSV column can only be assigned to one field.
                    </p>
                )}
            </section>

            <div className="column-mapping-actions">
                <Button variant="secondary" arrow="left" onClick={onBack} disabled={processing}>
                    Back
                </Button>

                <Button
                    variant="primary"
                    arrow="right"
                    onClick={handleConfirm}
                    disabled={!isValid || processing}
                    loading={processing}
                >
                    {processing ? "Processing..." : "Confirm mapping"}
                </Button>
            </div>
        </div>
    );
}
