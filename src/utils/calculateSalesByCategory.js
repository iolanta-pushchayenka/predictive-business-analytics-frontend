const SCALE = 1000000n;

// Convert a normalized decimal amount into integer units.
function toUnits(amount) {
    const value = String(amount);
    const negative = value.startsWith("-");
    const [integer, fraction = ""] = value.replace(/^-/, "").split(".");

    if (!/^\d+$/.test(integer) || !/^\d*$/.test(fraction) || fraction.length > 6) {
        throw new Error("Invalid normalized sales amount.");
    }

    const units = BigInt(integer) * SCALE + BigInt(fraction.padEnd(6, "0"));

    return negative ? -units : units;
}

// Group sales by product category.
export function calculateSalesByCategory(rows) {
    const categoryTotals = new Map();

    for (const row of rows) {
        const category = row.category?.trim();

        if (!category || row.amount == null) {
            continue;
        }

        const amount = toUnits(row.amount);

        categoryTotals.set(category, (categoryTotals.get(category) ?? 0n) + amount);
    }

    return [...categoryTotals.entries()]
        .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB))
        .map(([category, total]) => ({
            category,
            revenue: Number(total) / Number(SCALE)
        }));
}
