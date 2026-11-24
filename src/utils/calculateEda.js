import { selectAnalysisRows } from "./buildAnalysisEligibility.js";

import {
    calculateTotalRevenue,
    calculateNumberOfOrders,
    calculateAverageOrderValue,
    calculateUniqueCustomers
} from "./calculateKpis.js";

import { calculateMonthlyKpiChanges } from "./calculateMonthlyKpiChanges.js";
import { calculateMonthlySales } from "./calculateMonthlySales.js";
import { calculateSalesByCategory } from "./calculateSalesByCategory.js";
import { calculateSalesDistribution } from "./calculateSalesDistribution.js";
import { buildCorrelationAnalysis } from "./buildCorrelationAnalysis.js";

// Calculate all EDA results using shared JavaScript algorithms.
export function calculateEda({ result, mapping, columns = [], fullRows = [] }) {
    if (!result || !mapping) {
        throw new Error("Validated dataset and column mapping are required.");
    }

    // Select valid records for sales and customer KPIs.
    const sales = selectAnalysisRows(result, "overallNetSales");
    const customers = selectAnalysisRows(result, "customerLinkedSales");

    const salesRows = sales.status === "available" ? sales.rows : [];

    const customerRows = customers.status === "available" ? customers.rows : [];

    // Calculate business KPIs.
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

    // Calculate revenue grouped by category.
    const categorySales = selectAnalysisRows(result, "salesByCategory");

    const salesByCategory =
        categorySales.status === "available" ? calculateSalesByCategory(categorySales.rows) : [];

    // Calculate distribution of validated sales amounts.
    const salesDistribution = calculateSalesDistribution(salesRows);

    // Calculate Pearson correlations from original CSV columns.
    const correlationAnalysis = buildCorrelationAnalysis({
        columns,
        rows: fullRows,
        mapping
    });

    // Return everything the analytics dashboard needs.
    return {
        totalRevenue,
        numberOfOrders,
        averageOrderValue,
        uniqueCustomers,
        monthlyChanges,
        monthlySales,
        salesByCategory,
        salesDistribution,
        correlationAnalysis
    };
}
