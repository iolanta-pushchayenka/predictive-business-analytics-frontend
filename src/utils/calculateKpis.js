// Calculate total signed revenue from eligible records.
export function calculateTotalRevenue(rows) {
    let total = 0n;

    for (const row of rows) {
        const [integer, fraction = ""] = row.amount.split(".");

        const units = BigInt(integer) * 1000000n;
        const decimals = BigInt(fraction.padEnd(6, "0"));

        total += row.amount.startsWith("-") ? units - decimals : units + decimals;
    }

    const negative = total < 0n;
    const absolute = negative ? -total : total;

    const whole = absolute / 1000000n;
    const cents = (absolute % 1000000n).toString().padStart(6, "0").replace(/0+$/, "");

    return `${negative ? "-" : ""}${whole}${cents ? "." + cents : ""}`;
}

// Count unique orders among records with valid amounts.
export function calculateNumberOfOrders(rows) {
    const orderIds = new Set();

    for (const row of rows) {
        if (row.orderId !== null) {
            orderIds.add(row.orderId);
        }
    }

    return orderIds.size;
}

// Calculate average order value using records linked to known orders.
// export function calculateAverageOrderValue(rows) {
//     const orderRows = rows.filter((row) => row.orderId !== null);

//     const numberOfOrders = calculateNumberOfOrders(orderRows);

//     if (numberOfOrders === 0) {
//         return null;
//     }

//     const revenue = calculateTotalRevenue(orderRows);

//     return (Number(revenue) / numberOfOrders).toFixed(2);
// }

// Calculate average order value with exact decimal arithmetic.
export function calculateAverageOrderValue(rows) {
    const orderRows = rows.filter((row) => row.orderId !== null);

    const numberOfOrders = calculateNumberOfOrders(orderRows);

    if (numberOfOrders === 0) {
        return null;
    }

    const revenue = calculateTotalRevenue(orderRows);

    const negative = revenue.startsWith("-");
    const [integer, fraction = ""] = revenue.replace("-", "").split(".");

    const totalUnits = BigInt(integer) * 1000000n + BigInt(fraction.padEnd(6, "0"));

    const divisor = BigInt(numberOfOrders) * 10000n;
    const averageCents = (totalUnits + divisor / 2n) / divisor;

    const whole = averageCents / 100n;
    const cents = (averageCents % 100n).toString().padStart(2, "0");

    const sign = negative && averageCents !== 0n ? "-" : "";

    return `${sign}${whole}.${cents}`;
}

// Count unique customers among records with valid amounts.
export function calculateUniqueCustomers(rows) {
    const customerIds = new Set();

    for (const row of rows) {
        if (row.customerId !== null) {
            customerIds.add(row.customerId);
        }
    }

    return customerIds.size;
}
