import "./CsvPreview.css";

// Display the first rows of the selected CSV file.
export default function CsvPreview({ columns, rows }) {
    if (!columns?.length || !rows?.length) {
        return null;
    }

    return (
        <section className="csv-preview" aria-labelledby="csv-preview-title">
            <div className="csv-preview-header">
                <h2 id="csv-preview-title">CSV Preview</h2>

                <p>Showing the first {rows.length} rows of your dataset.</p>
            </div>

            <div
                className="csv-preview-table-container"
                role="region"
                aria-label="CSV preview table, scroll horizontally to view more columns"
                tabIndex={0}
            >
                <table>
                    <caption className="csv-preview-caption">
                        Preview of the uploaded CSV dataset
                    </caption>

                    <thead>
                        <tr>
                            {columns.map((column, index) => (
                                <th scope="col" key={index}>
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex}>{row[column] ?? ""}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
