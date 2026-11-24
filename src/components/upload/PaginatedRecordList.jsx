import { useId, useState } from "react";
import { getRecordPage } from "./validationReportPresentation.js";

export default function PaginatedRecordList({ items, label, getKey, renderItem }) {
    const id = useId();
    const [requestedPage, setRequestedPage] = useState(0);

    if (items.length === 0) return null;

    const page = getRecordPage(items, requestedPage);

    return (
        <div className="quality-record-list">
            <p id={id} className="quality-muted" aria-live="polite">
                {label} · {page.first}–{page.last} of {items.length}
            </p>
            <ul aria-labelledby={id}>
                {page.items.map((item) => (
                    <li key={getKey(item)}>{renderItem(item)}</li>
                ))}
            </ul>
            {page.pageCount > 1 && (
                <div className="quality-pagination" role="group" aria-label={`${label} pagination`}>
                    <button
                        type="button"
                        className="upload-secondary-button"
                        disabled={page.page === 0}
                        onClick={() => setRequestedPage(page.page - 1)}
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        className="upload-secondary-button"
                        disabled={page.page === page.pageCount - 1}
                        onClick={() => setRequestedPage(page.page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
