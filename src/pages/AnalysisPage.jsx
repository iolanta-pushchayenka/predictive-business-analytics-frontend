import { useContext } from "react";

import { UploadContext } from "../context/UploadContext";
import { selectAnalysisRows } from "../utils/buildAnalysisEligibility";

import {
    calculateTotalRevenue,
    calculateNumberOfOrders,
    calculateAverageOrderValue,
    calculateUniqueCustomers
} from "../utils/calculateKpis";

import KpiCard from "../components/analytics/KpiCard";

import "../css/Analysis.css";

import { formatMoney } from "../utils/formatMoney.js";

import { calculateMonthlyKpiChanges } from "../utils/calculateMonthlyKpiChanges.js";

// Display KPI results from the validated CSV dataset.
export default function AnalysisPage() {
    const upload = useContext(UploadContext);
    const result = upload?.validationResult;
    const mapping = upload?.confirmedMapping;

    if (!result || !mapping) {
        return (
            <section className="analysis-page">
                <h1>Analysis results</h1>
                <p>Upload and validate a CSV file to view analytics.</p>
            </section>
        );
    }

    const sales = selectAnalysisRows(result, "overallNetSales");
    const customers = selectAnalysisRows(result, "customerLinkedSales");

    const salesRows = sales.status === "available" ? sales.rows : [];
    const customerRows = customers.status === "available" ? customers.rows : [];

    const totalRevenue = sales.status === "available" ? calculateTotalRevenue(salesRows) : null;

    const numberOfOrders =
        mapping.orderId && sales.status === "available" ? calculateNumberOfOrders(salesRows) : null;

    const averageOrderValue =
        mapping.orderId && sales.status === "available"
            ? calculateAverageOrderValue(salesRows)
            : null;

    const uniqueCustomers =
        customers.status === "available" ? calculateUniqueCustomers(customerRows) : null;

    // Compare monthly KPIs using records with valid dates and amounts.
    const datedSales = selectAnalysisRows(result, "dailySalesTrends");

    const monthlyChanges =
        datedSales.status === "available"
            ? calculateMonthlyKpiChanges(datedSales.rows, mapping)
            : null;

    console.log(monthlyChanges);

    return (
        <section className="analysis-page">
            <h1>Analysis results</h1>

            <p className="analysis-description">
                Prepared from {result.report.totalRows.toLocaleString()} records
            </p>

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
        </section>
    );
}
