// Display the results of CSV data validation
export default function ValidationSummary({ validationResult, hasCustomerId }) {
    if (!validationResult) return null;

    const report = validationResult.report;

    const statistics = [
        ["Total records", report.totalRows],
        ["Records with valid dates", report.validDateRows],
        ["Records with valid amounts", report.validAmountRows],
        ["Records valid for dated sales", report.validSalesRows]
    ];

    const issues = [
        ["Missing dates", report.missingDates],
        ["Invalid dates", report.invalidDates],
        ["Missing amounts", report.missingAmounts],
        ["Invalid amounts", report.invalidAmounts],
        ["Negative amounts (review required)", report.negativeAmounts]
    ];

    if (hasCustomerId) {
        issues.push(["Missing customer IDs", report.missingCustomerIds]);
    }

    return (
        <section className="validation-summary" aria-label="Validation summary">
            <h2>Validation Summary</h2>

            <p className="validation-description">
                Review the data quality results before proceeding to analysis.
            </p>

            <div className="validation-stats">
                {statistics.map(([label, value]) => (
                    <div className="validation-stat" key={label}>
                        <span>{label}</span>
                        <strong>{value ?? 0}</strong>
                    </div>
                ))}
            </div>

            <h3>Detected Issues</h3>

            <div className="validation-issues">
                {issues.map(([label, value]) => (
                    <div className="validation-issue" key={label}>
                        <span>{label}</span>
                        <strong>{value ?? 0}</strong>
                    </div>
                ))}
            </div>
        </section>
    );
}
