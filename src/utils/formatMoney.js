// Format a canonical decimal amount for display.
export function formatMoney(value) {
    if (value === null) return null;

    const negative = value.startsWith("-");
    const [integer, fraction = ""] = value.replace(/^-/, "").split(".");

    const units = BigInt(integer) * 1000000n + BigInt(fraction.padEnd(6, "0"));

    const cents = (units + 5000n) / 10000n;

    const whole = (cents / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const decimals = (cents % 100n).toString().padStart(2, "0");
    const sign = negative && cents !== 0n ? "-" : "";

    return `${sign}${whole}.${decimals}`;
}
