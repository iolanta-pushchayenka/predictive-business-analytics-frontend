export const DATE_FORMATS = {
    DMY_SLASH: "DMY_SLASH",
    MDY_SLASH: "MDY_SLASH",
    YMD_DASH: "YMD_DASH",
    DMY_DOT: "DMY_DOT",
    YMD_SLASH: "YMD_SLASH"
};

const DATE_RULES = {
    DMY_SLASH: {
        pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/,
        order: ["day", "month", "year"]
    },
    MDY_SLASH: {
        pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/,
        order: ["month", "day", "year"]
    },
    YMD_DASH: {
        pattern: /^(\d{4})-(\d{2})-(\d{2})$/,
        order: ["year", "month", "day"]
    },
    DMY_DOT: {
        pattern: /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/,
        order: ["day", "month", "year"]
    },
    YMD_SLASH: {
        pattern: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
        order: ["year", "month", "day"]
    }
};

// Check whether a year is a leap year
function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

// Return the number of days in a month
function getDaysInMonth(year, month) {
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (month === 2 && isLeapYear(year)) {
        return 29;
    }

    return days[month - 1];
}

// Validate and normalize a date using an explicit format
export function normalizeDate(value, format = DATE_FORMATS.YMD_DASH, options = {}) {
    const rule = DATE_RULES[format];

    if (!rule) {
        throw new Error("Unsupported date format");
    }

    const { twoDigitYearCentury = 2000 } = options;

    if (
        !Number.isInteger(twoDigitYearCentury) ||
        twoDigitYearCentury < 0 ||
        twoDigitYearCentury > 9900 ||
        twoDigitYearCentury % 100 !== 0
    ) {
        throw new Error("Invalid two-digit year century");
    }

    if (value === null || value === undefined) {
        return { value: null, status: "missing" };
    }

    const text = String(value).trim();

    if (text === "") {
        return { value: null, status: "missing" };
    }

    const match = text.match(rule.pattern);

    if (!match) {
        return { value: null, status: "invalid" };
    }

    const parts = {};

    rule.order.forEach((field, index) => {
        parts[field] = Number(match[index + 1]);
    });

    let { year, month, day } = parts;

    const yearIndex = rule.order.indexOf("year") + 1;

    if (match[yearIndex].length === 2) {
        year += twoDigitYearCentury;
    }

    // Reject dates outside the supported calendar range
    if (year < 1 || year > 9999 || month < 1 || month > 12) {
        return { value: null, status: "invalid" };
    }

    const maxDay = getDaysInMonth(year, month);

    if (day < 1 || day > maxDay) {
        return { value: null, status: "invalid" };
    }

    const normalizedDate = [
        String(year).padStart(4, "0"),
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0")
    ].join("-");

    return {
        value: normalizedDate,
        status: "valid"
    };
}
