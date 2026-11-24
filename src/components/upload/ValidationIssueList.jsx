import { useState } from "react";
import PaginatedRecordList from "./PaginatedRecordList.jsx";

function IssueGroup({ group }) {
    const [expanded, setExpanded] = useState(false);

    return (
        <details
            className="quality-details"
            onToggle={(event) => setExpanded(event.currentTarget.open)}
        >
            <summary>
                <span className={`quality-badge quality-badge--${group.severity}`}>
                    {group.severity === "error" ? "Error" : "Warning"}
                </span>
                <span>{group.label}</span>
                <strong>{group.recordNumbers.length}</strong>
            </summary>
            {group.description && <p>{group.description}</p>}
            {expanded && (
                <PaginatedRecordList
                    items={group.recordNumbers}
                    label={`${group.label} record numbers`}
                    getKey={(recordNumber) => recordNumber}
                    renderItem={(recordNumber) => `Record ${recordNumber}`}
                />
            )}
        </details>
    );
}

export default function ValidationIssueList({ groups }) {
    return (
        <section className="quality-section">
            <h3>Record issues</h3>
            {groups.length === 0 ? (
                <p>No record errors or warnings were detected.</p>
            ) : (
                <>
                    <p>
                        An error affects operations that need the invalid or missing field. A
                        warning marks a value or record for review.
                    </p>
                    <p className="quality-muted">
                        Record numbers follow the order of data records after blank lines are
                        skipped. A record can appear in more than one issue group.
                    </p>
                    {groups.map((group) => (
                        <IssueGroup key={group.key} group={group} />
                    ))}
                </>
            )}
        </section>
    );
}
