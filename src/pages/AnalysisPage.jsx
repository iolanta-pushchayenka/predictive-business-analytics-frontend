import { useContext, useMemo, useState } from "react";

import { UploadContext } from "../context/UploadContext";
import { selectAnalysisRows } from "../utils/buildAnalysisEligibility";

import {
    calculateTotalRevenue,
    calculateNumberOfOrders,
    calculateAverageOrderValue,
    calculateUniqueCustomers
} from "../utils/calculateKpis";

import { formatMoney } from "../utils/formatMoney.js";
import { calculateMonthlyKpiChanges } from "../utils/calculateMonthlyKpiChanges.js";
import { calculateMonthlySales } from "../utils/calculateMonthlySales.js";
import { calculateSalesByCategory } from "../utils/calculateSalesByCategory.js";

import KpiCard from "../components/analytics/KpiCard";
import SalesDynamicsChart from "../components/analytics/SalesDynamicsChart";
import SalesByCategoryChart from "../components/analytics/SalesByCategoryChart.jsx";
import AnalysisTabs from "../components/analytics/AnalysisTabs";
import CorrelationMatrix from "../components/analytics/CorrelationMatrix.jsx";

import SalesDistributionChart from "../components/analytics/SalesDistributionChart";
import { calculateSalesDistribution } from "../utils/calculateSalesDistribution.js";

import { buildCorrelationAnalysis } from "../utils/buildCorrelationAnalysis.js";

import "../css/Analysis.css";

// Display analysis results for the validated CSV dataset.
export default function AnalysisPage() {
    const [activeTab, setActiveTab] = useState("eda");

    const upload = useContext(UploadContext);

    const result = upload?.validationResult;
    const mapping = upload?.confirmedMapping;
    const columns = upload?.columns;
    const fullRows = upload?.fullRows;
    const formats = upload?.formats;

    // Calculate correlation analysis from the original CSV columns.
    const correlationAnalysis = useMemo(() => {
        if (!result || !mapping || !columns || !fullRows) {
            return null;
        }

        return buildCorrelationAnalysis({
            columns,
            rows: fullRows,
            mapping
        });
    }, [result, mapping, columns, fullRows]);

    if (!result || !mapping) {
        return (
            <section className="analysis-page">
                <h1>Analysis results</h1>
                <p>Upload and validate a CSV file to view analytics.</p>
            </section>
        );
    }

    // Select validated records for sales and customer KPIs.
    const sales = selectAnalysisRows(result, "overallNetSales");
    const customers = selectAnalysisRows(result, "customerLinkedSales");

    const salesRows = sales.status === "available" ? sales.rows : [];
    const customerRows = customers.status === "available" ? customers.rows : [];

    // Calculate the available business KPIs.
    const totalRevenue = sales.status === "available" ? calculateTotalRevenue(salesRows) : null;

    const numberOfOrders =
        mapping.orderId && sales.status === "available" ? calculateNumberOfOrders(salesRows) : null;

    const averageOrderValue =
        mapping.orderId && sales.status === "available"
            ? calculateAverageOrderValue(salesRows)
            : null;

    const uniqueCustomers =
        customers.status === "available" ? calculateUniqueCustomers(customerRows) : null;

    // Calculate monthly sales and KPI changes.
    const datedSales = selectAnalysisRows(result, "dailySalesTrends");

    const monthlySales =
        datedSales.status === "available" ? calculateMonthlySales(datedSales.rows) : [];

    const monthlyChanges =
        datedSales.status === "available"
            ? calculateMonthlyKpiChanges(datedSales.rows, mapping)
            : null;

    // Calculate revenue by product category.
    const categorySales = selectAnalysisRows(result, "salesByCategory");

    const salesByCategory =
        categorySales.status === "available" ? calculateSalesByCategory(categorySales.rows) : [];

    // Calculate the frequency distribution of validated sales amounts.
    const salesDistribution = calculateSalesDistribution(salesRows);

    // Temporarily inspect correlation results before adding the chart.
    console.log("Correlation analysis:", correlationAnalysis);
    console.log("Selected CSV formats:", formats);

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
