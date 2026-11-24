import { useContext, useEffect, useState } from "react";

import { UploadContext } from "../context/UploadContext";

import { formatMoney } from "../utils/formatMoney.js";

import KpiCard from "../components/analytics/KpiCard";
import SalesDynamicsChart from "../components/analytics/SalesDynamicsChart";
import SalesByCategoryChart from "../components/analytics/SalesByCategoryChart.jsx";
import AnalysisTabs from "../components/analytics/AnalysisTabs";
import CorrelationMatrix from "../components/analytics/CorrelationMatrix.jsx";
import SalesDistributionChart from "../components/analytics/SalesDistributionChart";

import "../css/Analysis.css";

// Display analytics calculated by the Web Worker.
export default function AnalysisPage() {
    const [activeTab, setActiveTab] = useState("eda");

    const upload = useContext(UploadContext);

    const result = upload?.validationResult;
    const mapping = upload?.confirmedMapping;
    const columns = upload?.columns;
    const fullRows = upload?.fullRows;
    const runTask = upload?.runTask;

    const [edaState, setEdaState] = useState(null);

    // Request EDA calculations when the validated dataset changes.

    // Request EDA calculations when the validated dataset changes.
    useEffect(() => {
        if (!result || !mapping || !runTask) {
            return;
        }

        let active = true;

        // Execute EDA in the Worker and save the returned results.
        async function loadEda() {
            try {
                const { result: edaResult } = await runTask("CALCULATE_EDA", {
                    result,
                    mapping,
                    columns,
                    fullRows
                });

                if (!active) return;

                setEdaState({
                    sourceResult: result,
                    sourceMapping: mapping,
                    sourceColumns: columns,
                    sourceRows: fullRows,
                    data: edaResult,
                    error: ""
                });
            } catch (err) {
                if (!active || err.name === "AbortError") {
                    return;
                }

                setEdaState({
                    sourceResult: result,
                    sourceMapping: mapping,
                    sourceColumns: columns,
                    sourceRows: fullRows,
                    data: null,
                    error: err.message || "Failed to calculate analytics."
                });
            }
        }

        loadEda();

        // Ignore responses from outdated requests.
        return () => {
            active = false;
        };
    }, [result, mapping, columns, fullRows, runTask]);

    // Use only results belonging to the current dataset.
    const edaIsCurrent =
        edaState?.sourceResult === result &&
        edaState?.sourceMapping === mapping &&
        edaState?.sourceColumns === columns &&
        edaState?.sourceRows === fullRows;

    const eda = edaIsCurrent ? edaState.data : null;
    const edaError = edaIsCurrent ? edaState.error : "";

    // Show a message when no validated CSV is available.
    if (!result || !mapping) {
        return (
            <section className="analysis-page">
                <h1>Analysis results</h1>
                <p>Upload and validate a CSV file to view analytics.</p>
            </section>
        );
    }

    // Display calculation errors instead of outdated results.
    if (edaError) {
        return (
            <section className="analysis-page">
                <h1>Analysis results</h1>
                <p role="alert">{edaError}</p>
            </section>
        );
    }

    // Wait for the Worker to finish EDA calculations.
    if (!eda) {
        return (
            <section className="analysis-page">
                <h1>Analysis results</h1>
                <p role="status">Calculating analytics...</p>
            </section>
        );
    }

    // Read the completed analytics returned by the Worker.
    const {
        totalRevenue,
        numberOfOrders,
        averageOrderValue,
        uniqueCustomers,
        monthlyChanges,
        monthlySales,
        salesByCategory,
        salesDistribution,
        correlationAnalysis
    } = eda;

    return (
        <section className="analysis-page">
            <header className="analysis-page-header">
                <h1>Analysis results</h1>

                <p className="analysis-description">
                    Prepared from {result.report.totalRows.toLocaleString()} records
                    {" · "}Client-side processing
                </p>
            </header>

            <AnalysisTabs activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === "eda" && (
                <div className="analysis-content">
                    <div className="kpi-grid">
                        <KpiCard
                            title="Total Sales"
                            value={formatMoney(totalRevenue)}
                            change={monthlyChanges?.changes?.totalSales}
                        />

                        <KpiCard
                            title="Orders"
                            value={numberOfOrders?.toLocaleString()}
                            change={monthlyChanges?.changes?.orders}
                        />

                        <KpiCard
                            title="Customers"
                            value={uniqueCustomers?.toLocaleString()}
                            change={monthlyChanges?.changes?.customers}
                        />

                        <KpiCard
                            title="Average Order Value"
                            value={formatMoney(averageOrderValue)}
                            change={monthlyChanges?.changes?.averageOrderValue}
                        />
                    </div>

                    <div className="analysis-charts-grid">
                        <SalesDynamicsChart data={monthlySales} />

                        <SalesByCategoryChart data={salesByCategory} />

                        <SalesDistributionChart data={salesDistribution} />

                        <CorrelationMatrix data={correlationAnalysis} />
                    </div>
                </div>
            )}

            {activeTab === "forecasts" && (
                <section className="analysis-empty-section">
                    <h2>Sales Forecasts</h2>
                    <p>Sales forecasting is not available yet.</p>
                </section>
            )}

            {activeTab === "segmentation" && (
                <section className="analysis-empty-section">
                    <h2>Customer Segmentation</h2>
                    <p>Customer segmentation is not available yet.</p>
                </section>
            )}
        </section>
    );
}
