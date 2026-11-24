import { describe, expect, it } from "vitest";

import {
    parseCorrelationNumber,
    prepareCorrelationData
} from "../src/utils/prepareCorrelationData.js";

describe("prepareCorrelationData", () => {
    it("converts numeric values and preserves row alignment", () => {
        const rows = [
            { Sales: "120.50", Quantity: "2", Profit: "25.30" },
            { Sales: "80.00", Quantity: "1", Profit: "" },
            { Sales: "150.00", Quantity: "error", Profit: "45.00" }
        ];

        const result = prepareCorrelationData(rows, ["Sales", "Quantity", "Profit"]);

        expect(result.rows).toEqual([
            {
                sourceRowIndex: 0,
                values: { Sales: 120.5, Quantity: 2, Profit: 25.3 }
            },
            {
                sourceRowIndex: 1,
                values: { Sales: 80, Quantity: 1, Profit: null }
            },
            {
                sourceRowIndex: 2,
                values: { Sales: 150, Quantity: null, Profit: 45 }
            }
        ]);
    });

    it("tracks missing and invalid values", () => {
        const rows = [{ Sales: "100" }, { Sales: "" }, { Sales: "invalid" }, { Sales: "250" }];

        const result = prepareCorrelationData(rows, ["Sales"]);

        expect(result.stats.Sales).toEqual({
            valid: 2,
            missing: 1,
            invalid: 1
        });
    });

    it("supports European number formatting", () => {
        const options = {
            decimalSeparator: ",",
            thousandsSeparator: "."
        };

        expect(parseCorrelationNumber("1.250,75", options)).toBe(1250.75);

        expect(parseCorrelationNumber("-35,50", options)).toBe(-35.5);
    });

    it("rejects invalid values without replacing them with zero", () => {
        expect(parseCorrelationNumber("abc")).toBeNull();
        expect(parseCorrelationNumber("12abc")).toBeNull();
        expect(parseCorrelationNumber("")).toBeNull();
        expect(parseCorrelationNumber(null)).toBeNull();
        expect(parseCorrelationNumber("1,23,4")).toBeNull();
        expect(parseCorrelationNumber("Infinity")).toBeNull();
    });

    it("keeps legitimate zero and negative values", () => {
        expect(parseCorrelationNumber("0")).toBe(0);
        expect(parseCorrelationNumber("-125.75")).toBe(-125.75);
    });
});
