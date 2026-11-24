import {
    calculateTotalRevenue,
    calculateNumberOfOrders,
    calculateAverageOrderValue,
    calculateUniqueCustomers
} from "./calculateKpis.js";

// Select two calendar months before the latest dataset month.
export function selectComparisonMonths(rows) {
    const datedRows = rows.filter((row) => row.dateStatus === "valid");

    if (datedRows.length === 0) return null;

    const latestDate = datedRows.reduce(
        (latest, row) => (row.date > latest ? row.date : latest),
        datedRows[0].date
    );

    const latestMonth = latestDate.slice(0, 7);

    const previousMonth = (month) => {
        const [year, number] = month.split("-").map(Number);

        return number === 1 ? `${year - 1}-12` : `${year}-${String(number - 1).padStart(2, "0")}`;
    };

    const currentMonth = previousMonth(latestMonth);
    const comparisonMonth = previousMonth(currentMonth);

    return {
        currentMonth,
        comparisonMonth,
        currentRows: datedRows.filter((row) => row.date.startsWith(currentMonth)),
        previousRows: datedRows.filter((row) => row.date.startsWith(comparisonMonth))
    };
}

// Calculate percentage change using exact decimal arithmetic.
export function calculatePercentageChange(current, previous) {
    if (current === null || previous === null) return null;

    function toUnits(value) {
        const text = String(value);
        const negative = text.startsWith("-");
        const [integer, fraction = ""] = text.replace(/^-/, "").split(".");

        const units = BigInt(integer) * 1000000n + BigInt(fraction.padEnd(6, "0"));

        return negative ? -units : units;
    }

    const currentUnits = toUnits(current);
    const previousUnits = toUnits(previous);

    if (previousUnits <= 0n) return null;

    const difference = currentUnits - previousUnits;
    const negative = difference < 0n;
    const absolute = negative ? -difference : difference;

    // Calculate tenths of a percent, rounded to one decimal place.
    const tenths = (absolute * 1000n + previousUnits / 2n) / previousUnits;

    const whole = tenths / 10n;
    const decimal = tenths % 10n;

    const sign = tenths === 0n ? "" : negative ? "-" : "+";

    return `${sign}${whole}.${decimal}%`;
}

// Compare KPI values between two consecutive calendar months.
export function calculateMonthlyKpiChanges(rows, mapping) {
    const periods = selectComparisonMonths(rows);

    if (!periods) return null;

    const { currentRows, previousRows } = periods;

    if (currentRows.length === 0 || previousRows.length === 0) {
        return {
            currentMonth: periods.currentMonth,
            previousMonth: periods.comparisonMonth,
            changes: null
        };
    }

    const compare = (calculate) =>
        calculatePercentageChange(calculate(currentRows), calculate(previousRows));

    return {
        currentMonth: periods.currentMonth,
        previousMonth: periods.comparisonMonth,

        changes: {
            totalSales: compare(calculateTotalRevenue),

            orders: mapping.orderId ? compare(calculateNumberOfOrders) : null,

            customers: mapping.customerId ? compare(calculateUniqueCustomers) : null,

            averageOrderValue: mapping.orderId ? compare(calculateAverageOrderValue) : null
        }
    };
}
