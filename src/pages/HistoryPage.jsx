import { useMemo, useState } from "react";

import AnalysisHistoryList from "../components/history/AnalysisHistoryList";
import { demoAnalyses } from "../data/demoAnalyses";

import "../css/HistoryPage.css";

// Check whether a record belongs to the selected date range.
function matchesPeriod(createdAt, period, now) {
    if (period === "all") {
        return true;
    }

    const recordDate = new Date(createdAt).getTime();
    const days = Number(period);
    const difference = now - recordDate;

    return difference >= 0 && difference <= days * 24 * 60 * 60 * 1000;
}

// Use a fixed reference date for demonstration records.
const DEMO_REFERENCE_DATE = new Date("2026-11-24T23:59:59").getTime();

// Display the analysis history with search, filtering and sorting.
export default function HistoryPage() {
    const [search, setSearch] = useState("");
    const [period, setPeriod] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest");

    // Snapshot of demo records; replace with API data later.
    const analyses = demoAnalyses;

    const visibleAnalyses = useMemo(() => {
        const query = search.trim().toLowerCase();

        return analyses
            .filter((analysis) => analysis.datasetName.toLowerCase().includes(query))
            .filter((analysis) => matchesPeriod(analysis.createdAt, period, DEMO_REFERENCE_DATE))
            .sort((a, b) => {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();

                return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
            });
    }, [analyses, search, period, sortOrder]);

    return (
        <main className="history-page">
            <header className="history-heading">
                <span className="history-eyebrow">SAVED RESULTS</span>

                <h1>Analysis history</h1>
            </header>

            <div className="history-controls">
                <div className="history-search">
                    <label htmlFor="history-search">Search by dataset name</label>

                    <input
                        id="history-search"
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search analyses..."
                    />
                </div>

                <div className="history-control">
                    <label htmlFor="history-period">Filter by date</label>

                    <select
                        id="history-period"
                        value={period}
                        onChange={(event) => setPeriod(event.target.value)}
                    >
                        <option value="all">All time</option>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                    </select>
                </div>

                <div className="history-control">
                    <label htmlFor="history-sort">Sort by date</label>

                    <select
                        id="history-sort"
                        value={sortOrder}
                        onChange={(event) => setSortOrder(event.target.value)}
                    >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                    </select>
                </div>
            </div>

            <section className="history-results" aria-labelledby="history-results-title">
                <div className="history-results-heading">
                    <h2 id="history-results-title">Search results</h2>

                    <span role="status" aria-live="polite">
                        {visibleAnalyses.length} results
                    </span>
                </div>

                <AnalysisHistoryList analyses={visibleAnalyses} />
            </section>
        </main>
    );
}
