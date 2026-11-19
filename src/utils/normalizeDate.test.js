import { describe, it, expect } from "vitest";
import { normalizeDate, DATE_FORMATS } from "./normalizeDate";

describe("normalizeDate", () => {
    // Test supported date formats
    describe("Supported formats", () => {
        it.each([
            ["17/11/2026", DATE_FORMATS.DMY_SLASH, "2026-11-17"],
            ["11/17/2026", DATE_FORMATS.MDY_SLASH, "2026-11-17"],
            ["2026-11-17", DATE_FORMATS.YMD_DASH, "2026-11-17"],
            ["17.11.2026", DATE_FORMATS.DMY_DOT, "2026-11-17"],
            ["2026/11/17", DATE_FORMATS.YMD_SLASH, "2026-11-17"]
        ])("normalizes %s using %s", (input, format, expected) => {
            expect(normalizeDate(input, format)).toEqual({
                value: expected,
                status: "valid"
            });
        });
    });

    // Test two-digit year handling
    describe("Two-digit years", () => {
        it("uses the default century", () => {
            expect(normalizeDate("17/11/26", DATE_FORMATS.DMY_SLASH)).toEqual({
                value: "2026-11-17",
                status: "valid"
            });
        });

        it("supports a specified century", () => {
            expect(
                normalizeDate("17/11/96", DATE_FORMATS.DMY_SLASH, {
                    twoDigitYearCentury: 1900
                })
            ).toEqual({
                value: "1996-11-17",
                status: "valid"
            });
        });

        it("rejects an invalid century configuration", () => {
            expect(() =>
                normalizeDate("17/11/26", DATE_FORMATS.DMY_SLASH, { twoDigitYearCentury: 1950 })
            ).toThrow("Invalid two-digit year century");
        });
    });

    // Test leap years
    describe("Leap years", () => {
        it("accepts February 29 in 2024", () => {
            expect(normalizeDate("29/02/2024", DATE_FORMATS.DMY_SLASH)).toEqual({
                value: "2024-02-29",
                status: "valid"
            });
        });

        it("rejects February 29 in 2025", () => {
            expect(normalizeDate("29/02/2025", DATE_FORMATS.DMY_SLASH)).toEqual({
                value: null,
                status: "invalid"
            });
        });

        it("rejects February 29 in 1900", () => {
            expect(normalizeDate("29/02/1900", DATE_FORMATS.DMY_SLASH)).toEqual({
                value: null,
                status: "invalid"
            });
        });

        it("accepts February 29 in 2000", () => {
            expect(normalizeDate("29/02/2000", DATE_FORMATS.DMY_SLASH)).toEqual({
                value: "2000-02-29",
                status: "valid"
            });
        });
    });

    // Test invalid calendar dates
    describe("Invalid dates", () => {
        it.each([
            "31/04/2026",
            "32/01/2026",
            "00/01/2026",
            "17/13/2026",
            "17/00/2026",
            "17/11/0000"
        ])("rejects %s", (input) => {
            expect(normalizeDate(input, DATE_FORMATS.DMY_SLASH)).toEqual({
                value: null,
                status: "invalid"
            });
        });

        it("rejects a date with the wrong format", () => {
            expect(normalizeDate("17/11/2026", DATE_FORMATS.MDY_SLASH)).toEqual({
                value: null,
                status: "invalid"
            });
        });

        it("rejects an unknown date format", () => {
            expect(() => normalizeDate("17/11/2026", "UNKNOWN")).toThrow("Unsupported date format");
        });
    });

    // Test missing values
    describe("Missing values", () => {
        it.each([null, undefined, "", "   "])("identifies missing value %s", (input) => {
            expect(normalizeDate(input, DATE_FORMATS.DMY_SLASH)).toEqual({
                value: null,
                status: "missing"
            });
        });
    });

    // Test normalization details
    describe("Normalization", () => {
        it("adds leading zeros to day and month", () => {
            expect(normalizeDate("7/1/2026", DATE_FORMATS.DMY_SLASH)).toEqual({
                value: "2026-01-07",
                status: "valid"
            });
        });

        it("removes surrounding whitespace", () => {
            expect(normalizeDate(" 17/11/2026 ", DATE_FORMATS.DMY_SLASH)).toEqual({
                value: "2026-11-17",
                status: "valid"
            });
        });

        it("interprets ambiguous dates using the selected format", () => {
            expect(normalizeDate("08/11/2026", DATE_FORMATS.DMY_SLASH).value).toBe("2026-11-08");

            expect(normalizeDate("08/11/2026", DATE_FORMATS.MDY_SLASH).value).toBe("2026-08-11");
        });
    });
});
