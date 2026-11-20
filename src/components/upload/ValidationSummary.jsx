// // Display the results of CSV data validation
// export default function ValidationSummary({ validationResult, hasCustomerId }) {
//     if (!validationResult) return null;

//     const report = validationResult.report;

//     const statistics = [
//         ["Total records", report.totalRows],
//         ["Records with valid dates", report.validDateRows],
//         ["Records with valid amounts", report.validAmountRows],
//         ["Records valid for dated sales", report.validSalesRows]
//     ];

//     const issues = [
//         ["Missing dates", report.missingDates],
//         ["Invalid dates", report.invalidDates],
//         ["Missing amounts", report.missingAmounts],
//         ["Invalid amounts", report.invalidAmounts],
//         ["Negative amounts (review required)", report.negativeAmounts]
//     ];

//     if (hasCustomerId) {
//         issues.push(["Missing customer IDs", report.missingCustomerIds]);
//     }

//     return (
//         <section className="validation-summary" aria-label="Validation summary">
//             <h2>Validation Summary</h2>

//             <p className="validation-description">
//                 Review the data quality results before proceeding to analysis.
//             </p>

//             <div className="validation-stats">
//                 {statistics.map(([label, value]) => (
//                     <div className="validation-stat" key={label}>
//                         <span>{label}</span>
//                         <strong>{value ?? 0}</strong>
//                     </div>
//                 ))}
//             </div>

//             <h3>Detected Issues</h3>

//             <div className="validation-issues">
//                 {issues.map(([label, value]) => (
//                     <div className="validation-issue" key={label}>
//                         <span>{label}</span>
//                         <strong>{value ?? 0}</strong>
//                     </div>
//                 ))}
//             </div>
//         </section>
//     );
// }

import { useId, useMemo, useState } from "react";
import AnalysisAvailability from "./AnalysisAvailability.jsx";
import PaginatedRecordList from "./PaginatedRecordList.jsx";
import ValidationIssueList from "./ValidationIssueList.jsx";
import {
    fieldLabel,
    getOutlierUnavailableReason,
    groupValidationIssues
} from "./validationReportPresentation.js";

function MetricList({ items }) {
    return (
        <dl className="quality-metrics">
            {items.map(([label, value]) => (
                <div key={label} className="validation-stat">
                    <dt>{label}</dt>
                    <dd>{value ?? "Unavailable"}</dd>
                </div>
            ))}
        </dl>
    );
}

function IntegrityStatus({ integrity }) {
    const [expanded, setExpanded] = useState(false);
    const violations = integrity?.violations ?? [];

    if (integrity?.status === "passed") {
        return (
            <p className="quality-notice quality-notice--ok">Preparation integrity check passed.</p>
        );
    }

    return (
        <div className="quality-notice quality-notice--error">
            <p role="alert">
                {integrity?.status === "failed"
                    ? "Preparation integrity check failed. Analytics is blocked."
                    : "Preparation integrity has not been confirmed. Analytics is blocked."}
            </p>
            {violations.length > 0 && (
                <details
                    className="quality-details"
                    onToggle={(event) => setExpanded(event.currentTarget.open)}
                >
                    <summary>View integrity violations ({violations.length})</summary>
                    {expanded && (
                        <PaginatedRecordList
                            items={violations}
                            label="Integrity violations"
                            getKey={({ code, recordNumber, field }) =>
                                JSON.stringify([code, recordNumber, field])
                            }
                            renderItem={({ code, recordNumber, field }) =>
                                [
                                    code,
                                    recordNumber == null ? null : `Record ${recordNumber}`,
                                    field == null ? null : fieldLabel(field)
                                ]
                                    .filter(Boolean)
                                    .join(" · ")
                            }
                        />
                    )}
                </details>
            )}
        </div>
    );
}

function OutlierSummary({ analysis, count }) {
    return (
        <section className="quality-section">
            <h3>High-value outlier check</h3>
            <MetricList
                items={[
                    ["Eligible amounts", analysis?.eligibleCount],
                    ["Records flagged for review", count]
                ]}
            />
            {analysis?.status === "available" ? (
                <p>
                    Upper threshold: <strong>{analysis.upperThreshold}</strong>. Only amounts
                    strictly above this threshold are flagged.
                </p>
            ) : (
                <p>{getOutlierUnavailableReason(analysis)}</p>
            )}
        </section>
    );
}

export default function ValidationSummary({
    validationResult,
    initialProfile,
    confirmedMapping,
    readiness,
    busy = false
}) {
    const titleId = useId();
    const issues = validationResult?.issues;
    const groups = useMemo(() => groupValidationIssues(issues ?? []), [issues]);

    if (!validationResult?.report) {
        return (
            <section className="validation-summary quality-report" aria-labelledby={titleId}>
                <h2 id={titleId}>Data Quality Report</h2>
                {busy ? (
                    <p role="status">Waiting for dataset validation to complete.</p>
                ) : (
                    <p>
                        Complete validation to view this report. Use Back to review the data
                        formats.
                    </p>
                )}
            </section>
        );
    }

    const { report, outlierAnalysis, analysisEligibility, integrity } = validationResult;
    const datasetMetrics = [
        ["Total records", report.totalRows],
        ["Records with valid dates", report.validDateRows],
        ["Records with valid amounts", report.validAmountRows],
        ["Records valid for dated sales", report.validSalesRows]
    ];

    if (initialProfile) {
        datasetMetrics.push(
            ["CSV columns", initialProfile.totalColumns],
            ["Unmapped columns", initialProfile.unmappedColumnCount]
        );
    }

    const fieldMetrics = [
        ["Missing dates", report.missingDates],
        ["Invalid dates", report.invalidDates],
        ["Missing amounts", report.missingAmounts],
        ["Invalid amounts", report.invalidAmounts],
        ["Negative amounts", report.negativeAmounts],
        ["Zero amounts", report.zeroAmounts]
    ];

    if (confirmedMapping?.customerId) {
        fieldMetrics.push(["Missing Customer IDs", report.missingCustomerIds]);
    }

    const canProceed = readiness?.canProceed === true;

    return (
        <section className="validation-summary quality-report" aria-labelledby={titleId}>
            <h2 id={titleId}>Data Quality Report</h2>
            <IntegrityStatus integrity={integrity} />

            <section className="quality-section">
                <h3>Dataset summary</h3>
                <MetricList items={datasetMetrics} />
            </section>

            <section className="quality-section">
                <h3>Field quality</h3>
                <MetricList items={fieldMetrics} />
                <p className="quality-muted">
                    Zero amounts are valid. Negative amounts are valid signed values and may
                    represent refunds or adjustments.
                </p>
            </section>

            <ValidationIssueList groups={groups} />
            <OutlierSummary analysis={outlierAnalysis} count={report.highValueOutlierCount} />
            <AnalysisAvailability
                eligibility={analysisEligibility}
                integrityPassed={integrity?.status === "passed"}
            />

            <section className="quality-section quality-readiness">
                <h3>Analytics readiness</h3>
                <p role="status">
                    <strong>{canProceed ? "Ready for analytics" : "Analytics unavailable"}</strong>
                    {" · "}
                    {readiness?.message ?? "Complete dataset validation first."}
                </p>
            </section>
        </section>
    );
}
