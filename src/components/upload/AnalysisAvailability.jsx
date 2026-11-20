import { useState } from "react";
import PaginatedRecordList from "./PaginatedRecordList.jsx";
import {
    ANALYSIS_OPERATIONS,
    exclusionLabel,
    getOperationReason
} from "./validationReportPresentation.js";

function OperationCard({ label, operation }) {
    const [expanded, setExpanded] = useState(false);
    const available = operation?.status === "available";
    const excludedRecords = operation?.excludedRecords ?? [];

    return (
        <article className="quality-operation">
            <div className="quality-operation-heading">
                <h4>{label}</h4>
                <span className={`quality-badge quality-badge--${available ? "ok" : "neutral"}`}>
                    {available ? "Available" : "Unavailable"}
                </span>
            </div>

            {operation && (
                <dl className="quality-counts">
                    <div>
                        <dt>Eligible</dt>
                        <dd>{operation.eligibleCount}</dd>
                    </div>
                    <div>
                        <dt>Excluded</dt>
                        <dd>{operation.excludedCount}</dd>
                    </div>
                </dl>
            )}

            {!available && <p>{getOperationReason(operation)}</p>}

            {excludedRecords.length > 0 && (
                <details
                    className="quality-details"
                    onToggle={(event) => setExpanded(event.currentTarget.open)}
                >
                    <summary>View excluded records</summary>
                    {expanded && (
                        <PaginatedRecordList
                            items={excludedRecords}
                            label={`${label} exclusions`}
                            getKey={({ recordNumber }) => recordNumber}
                            renderItem={({ recordNumber, reasons }) =>
                                `Record ${recordNumber}: ${reasons.map(exclusionLabel).join(", ")}`
                            }
                        />
                    )}
                </details>
            )}
        </article>
    );
}

export default function AnalysisAvailability({ eligibility, integrityPassed }) {
    return (
        <section className="quality-section">
            <h3>Analysis availability</h3>
            {!integrityPassed && (
                <p>
                    These counts are shown for review. Analytics requires a successful integrity
                    check.
                </p>
            )}
            <div className="quality-operation-grid">
                {ANALYSIS_OPERATIONS.map(({ key, label }) => (
                    <OperationCard key={key} label={label} operation={eligibility?.[key]} />
                ))}
            </div>
        </section>
    );
}
