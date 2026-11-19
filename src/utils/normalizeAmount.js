export const AMOUNT_FORMATS = {
    DOT: "dot",
    US: "us",
    EU_DOT: "eu-dot",
    EU_SPACE: "eu-space",
    COMMA: "comma"
};

const MAX_INTEGER_DIGITS = 12;
const MAX_DECIMAL_PLACES = 6;

const FORMAT_RULES = {
    dot: {
        pattern: /^[+-]?\d+(?:\.\d+)?$/,
        decimal: ".",
        thousands: null
    },
    us: {
        pattern: /^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/,
        decimal: ".",
        thousands: ","
    },
    "eu-dot": {
        pattern: /^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d+)?$/,
        decimal: ",",
        thousands: "."
    },
    "eu-space": {
        pattern: /^[+-]?(?:\d+|\d{1,3}(?: \d{3})+)(?:,\d+)?$/,
        decimal: ",",
        thousands: " "
    },
    comma: {
        pattern: /^[+-]?\d+(?:,\d+)?$/,
        decimal: ",",
        thousands: null
    }
};

// Validate and normalize an amount without converting it to Number
export function normalizeAmount(value, format = AMOUNT_FORMATS.DOT) {
    const rules = FORMAT_RULES[format];

    if (!rules) {
        throw new Error("Unsupported amount format");
    }

    if (value === null || value === undefined || value === "") {
        return { value: null, status: "missing" };
    }

    // CSV input must remain a string to prevent earlier precision loss
    if (typeof value !== "string") {
        return { value: null, status: "invalid" };
    }

    const text = value.trim().replace(/[\u00A0\u202F]/g, " ");

    if (text === "") {
        return { value: null, status: "missing" };
    }

    if (!rules.pattern.test(text)) {
        return { value: null, status: "invalid" };
    }

    let normalized = text;

    if (rules.thousands) {
        normalized = normalized.split(rules.thousands).join("");
    }

    if (rules.decimal === ",") {
        normalized = normalized.replace(",", ".");
    }

    const isNegative = normalized.startsWith("-");

    // Remove the sign before checking the numeric parts
    const unsigned = normalized.replace(/^[+-]/, "");
    const [integerPart, decimalPart = ""] = unsigned.split(".");

    // Remove unnecessary leading and trailing zeros
    const integer = integerPart.replace(/^0+/, "") || "0";
    const decimal = decimalPart.replace(/0+$/, "");

    if (integer.length > MAX_INTEGER_DIGITS || decimal.length > MAX_DECIMAL_PLACES) {
        return { value: null, status: "invalid" };
    }

    const isZero = integer === "0" && decimal === "";

    const sign = isNegative && !isZero ? "-" : "";
    const result = sign + integer + (decimal ? "." + decimal : "");

    return {
        value: result,
        status: isNegative && !isZero ? "negative" : "valid"
    };
}
