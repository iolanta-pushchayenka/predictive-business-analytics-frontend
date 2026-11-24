// Display analysis records in a reusable, accessible table.
export default function AnalysisHistoryList({ analyses }) {
    if (analyses.length === 0) {
        return (
            <p className="history-empty" role="status">
                No matching analyses found.
            </p>
        );
    }

    return (
        <div className="history-table-wrapper">
            <table className="history-table">
                <thead>
                    <tr>
                        <th scope="col">Dataset</th>
                        <th scope="col">Created</th>
                    </tr>
                </thead>

                <tbody>
                    {analyses.map((analysis) => (
                        <tr key={analysis.id}>
                            <td className="history-dataset">{analysis.datasetName}</td>

                            <td>
                                <time dateTime={analysis.createdAt}>
                                    {new Date(analysis.createdAt).toLocaleString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                </time>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
