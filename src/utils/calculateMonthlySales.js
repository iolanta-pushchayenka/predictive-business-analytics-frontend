// Aggregate valid sales amounts by calendar month.
export function calculateMonthlySales(rows) {
    const monthlyTotals = new Map();

    for (const row of rows) {
        const month = row.date.slice(0, 7);

        const negative = row.amount.startsWith("-");
        const [integer, fraction = ""] = row.amount.replace(/^-/, "").split(".");

        const units = BigInt(integer) * 1000000n + BigInt(fraction.padEnd(6, "0"));

        const amountUnits = negative ? -units : units;

        monthlyTotals.set(month, (monthlyTotals.get(month) ?? 0n) + amountUnits);
    }

    return [...monthlyTotals.entries()]
        .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
        .map(([month, total]) => ({
            month,
            revenue: Number(total) / 1000000
        }));
}
