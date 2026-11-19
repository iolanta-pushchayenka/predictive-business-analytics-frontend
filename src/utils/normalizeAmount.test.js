import { describe, it, expect } from "vitest";
import { normalizeAmount, AMOUNT_FORMATS } from "./normalizeAmount";

describe("normalizeAmount", () => {
    it.each([
        ["1234.56", AMOUNT_FORMATS.DOT, "1234.56"],
        ["1,234.56", AMOUNT_FORMATS.US, "1234.56"],
        ["1.234,56", AMOUNT_FORMATS.EU_DOT, "1234.56"],
        ["1 234,56", AMOUNT_FORMATS.EU_SPACE, "1234.56"],
        ["1234,56", AMOUNT_FORMATS.COMMA, "1234.56"]
    ])("normalizes %s using %s", (input, format, expected) => {
        expect(normalizeAmount(input, format)).toEqual({
            value: expected,
            status: "valid"
        });
    });

    it("preserves negative amounts", () => {
        expect(normalizeAmount("-25.50")).toEqual({
            value: "-25.5",
            status: "negative"
        });
    });

    it("normalizes negative zero", () => {
        expect(normalizeAmount("-0.00")).toEqual({
            value: "0",
            status: "valid"
        });
    });

    it("accepts zero", () => {
        expect(normalizeAmount("0")).toEqual({
            value: "0",
            status: "valid"
        });
    });

    it("identifies missing amounts", () => {
        expect(normalizeAmount("  ")).toEqual({
            value: null,
            status: "missing"
        });
    });

    it("rejects an invalid number format", () => {
        expect(normalizeAmount("12,34.56", "us")).toEqual({
            value: null,
            status: "invalid"
        });
    });

    it("rejects values beyond the integer limit", () => {
        expect(normalizeAmount("9007199254740990.99")).toEqual({
            value: null,
            status: "invalid"
        });
    });

    it("rejects values beyond the decimal precision limit", () => {
        expect(normalizeAmount("0.0000001")).toEqual({
            value: null,
            status: "invalid"
        });
    });

    it("rejects non-string input", () => {
        expect(normalizeAmount(125.5)).toEqual({
            value: null,
            status: "invalid"
        });
    });

    it("rejects unsupported configuration", () => {
        expect(() => normalizeAmount("100", "unknown")).toThrow("Unsupported amount format");
    });
});
