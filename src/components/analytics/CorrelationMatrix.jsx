import "./CorrelationMatrix.css";

// Interpolate between two RGB colors.
function mixColors(start, end, ratio) {
    const result = start.map((value, index) => Math.round(value + (end[index] - value) * ratio));

    return `rgb(${result.join(", ")})`;
}

// Choose a cell color based on the Pearson correlation value.
function getCorrelationColor(value) {
    if (value === null || !Number.isFinite(value)) {
        return "#F0EEF2";
    }

    const neutral = [245, 241, 248];
    const negative = [201, 134, 153];
    const positive = [121, 80, 163];

    if (value < 0) {
        return mixColors(neutral, negative, Math.abs(value));
    }

    return mixColors(neutral, positive, value);
}

// Display a responsive heatmap of Pearson correlations.
export default function CorrelationMatrix({ data }) {
    const columns = data?.columns ?? [];
    const matrix = data?.matrix ?? [];

    const available =
        data?.status === "available" && columns.length >= 2 && matrix.length === columns.length;

    return (
        <section className="correlation-card" aria-labelledby="correlation-title">
            <div className="correlation-header">
                <h2 id="correlation-title">Correlation Matrix</h2>
                <p>Relationships between numeric variables</p>
            </div>

            {!available ? (
                <p className="correlation-empty">
                    {data?.reason === "insufficient_valid_pairs"
                        ? "Not enough valid paired values to calculate correlations."
                        : "At least two numeric columns are required for correlation analysis."}
                </p>
            ) : (
                <>
                    <div
                        className="correlation-table-scroll"
                        role="region"
                        aria-label="Scrollable correlation matrix"
                        tabIndex={0}
                    >
                        <table className="correlation-table">
                            <thead>
                                <tr>
                                    <th scope="col" className="correlation-corner" />
                                    {columns.map((column) => (
                                        <th scope="col" key={column}>
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {matrix.map((row, rowIndex) => (
                                    <tr key={columns[rowIndex]}>
                                        <th scope="row">{columns[rowIndex]}</th>

                                        {row.map((cell, columnIndex) => {
                                            const value = cell.value;
                                            const isDark = value !== null && value >= 0.65;

                                            const formatted =
                                                value === null ? "N/A" : value.toFixed(2);

                                            return (
                                                <td
                                                    key={`${rowIndex}-${columnIndex}`}
                                                    className={
                                                        isDark
                                                            ? "correlation-cell correlation-cell-dark"
                                                            : "correlation-cell"
                                                    }
                                                    style={{
                                                        backgroundColor: getCorrelationColor(value)
                                                    }}
                                                    title={
                                                        `${cell.x} × ${cell.y}\n` +
                                                        `Correlation: ${formatted}\n` +
                                                        `Valid pairs: ${cell.pairCount}`
                                                    }
                                                    aria-label={
                                                        `${cell.x} and ${cell.y}: ` +
                                                        `${formatted}, ${cell.pairCount} valid pairs`
                                                    }
                                                >
                                                    {formatted}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="correlation-legend">
                        <span className="correlation-legend-title">Correlation</span>

                        <div className="correlation-legend-scale">
                            <div className="correlation-legend-bar" />

                            <div className="correlation-legend-labels">
                                <span>−1.00</span>
                                <span>0</span>
                                <span>+1.00</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}
