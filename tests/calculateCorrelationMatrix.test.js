import { describe, expect, it } from "vitest";

import { calculateCorrelationMatrix } from "../src/utils/calculateCorrelationMatrix.js";

describe("calculateCorrelationMatrix", () => {
    it("calculates perfect positive correlation", () => {
        const preparedData = {
            columns: ["Sales", "Quantity"],
            rows: [
                { values: { Sales: 100, Quantity: 1 } },
                { values: { Sales: 200, Quantity: 2 } },
                { values: { Sales: 300, Quantity: 3 } },
                { values: { Sales: 400, Quantity: 4 } }
            ]
        };

        const result = calculateCorrelationMatrix(preparedData);

        expect(result.matrix[0][1].value).toBeCloseTo(1);
        expect(result.matrix[0][1].pairCount).toBe(4);
        expect(result.matrix[1][0].value).toBeCloseTo(1);
    });

    it("calculates perfect negative correlation", () => {
        const preparedData = {
            columns: ["Sales", "Discount"],
            rows: [
                { values: { Sales: 100, Discount: 4 } },
                { values: { Sales: 200, Discount: 3 } },
                { values: { Sales: 300, Discount: 2 } },
                { values: { Sales: 400, Discount: 1 } }
            ]
        };

        const result = calculateCorrelationMatrix(preparedData);

        expect(result.matrix[0][1].value).toBeCloseTo(-1);
    });

    it("ignores missing values only for affected pairs", () => {
        const preparedData = {
            columns: ["Sales", "Quantity", "Profit"],
            rows: [
                { values: { Sales: 100, Quantity: 1, Profit: 10 } },
                { values: { Sales: 200, Quantity: 2, Profit: null } },
                { values: { Sales: 300, Quantity: 3, Profit: 30 } },
                { values: { Sales: 400, Quantity: 4, Profit: 40 } }
            ]
        };

        const result = calculateCorrelationMatrix(preparedData);

        expect(result.matrix[0][1].pairCount).toBe(4);
        expect(result.matrix[0][2].pairCount).toBe(3);
        expect(result.matrix[0][2].value).toBeCloseTo(1);
    });

    it("returns null for constant columns", () => {
        const preparedData = {
            columns: ["Sales", "Constant"],
            rows: [
                { values: { Sales: 100, Constant: 5 } },
                { values: { Sales: 200, Constant: 5 } },
                { values: { Sales: 300, Constant: 5 } }
            ]
        };

        const result = calculateCorrelationMatrix(preparedData);

        expect(result.matrix[0][1].value).toBeNull();
        expect(result.matrix[1][1].value).toBeNull();
    });

    it("returns null when fewer than three valid pairs exist", () => {
        const preparedData = {
            columns: ["Sales", "Profit"],
            rows: [
                { values: { Sales: 100, Profit: 10 } },
                { values: { Sales: 200, Profit: null } },
                { values: { Sales: 300, Profit: 30 } }
            ]
        };

        const result = calculateCorrelationMatrix(preparedData);

        expect(result.matrix[0][1].value).toBeNull();
        expect(result.matrix[0][1].pairCount).toBe(2);
    });

    it("returns an empty matrix for invalid input", () => {
        expect(calculateCorrelationMatrix(null)).toEqual({
            columns: [],
            matrix: []
        });
    });
});
