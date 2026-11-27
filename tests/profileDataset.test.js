import { describe, expect, it } from "vitest";
import { parseCsv, profileDataset } from "analytics-core";

describe("profileDataset", () => {
    it("counts raw presence and distinct trimmed values without changing source records", async () => {
        const { columns, rows } = await parseCsv(
            "date,amount,customer,order,category,note\n" +
                "2026-11-01,1, 001 ,A, Books ,x\n" +
                " ,not a number,001,A,books,y\n" +
                "2026-11-02,,1,B,Books,z\n" +
                "bad date,0,, , ,w"
        );
        const original = rows.map((row) => ({ ...row }));
        rows.forEach(Object.freeze);
        Object.freeze(rows);
        Object.freeze(columns);

        expect(
            profileDataset(rows, columns, {
                date: "date",
                amount: "amount",
                customerId: "customer",
                orderId: "order",
                category: "category"
            })
        ).toEqual({
            totalRows: 4,
            totalColumns: 6,
            unmappedColumnCount: 1,
            mappedFields: {
                date: { column: "date", missingCount: 1, nonemptyCount: 3 },
                amount: { column: "amount", missingCount: 1, nonemptyCount: 3 },
                customerId: {
                    column: "customer",
                    missingCount: 1,
                    nonemptyCount: 3,
                    distinctNonemptyCount: 2
                },
                orderId: {
                    column: "order",
                    missingCount: 1,
                    nonemptyCount: 3,
                    distinctNonemptyCount: 2
                },
                category: {
                    column: "category",
                    missingCount: 1,
                    nonemptyCount: 3,
                    distinctNonemptyCount: 2
                }
            }
        });
        expect(rows).toEqual(original);
    });

    it("distinguishes an unmapped field from a mapped field with only missing values", () => {
        const rows = [{ day: "", total: "", group: "", customer: "001" }];
        const columns = ["day", "total", "group", "customer"];
        const profile = profileDataset(rows, columns, {
            date: "day",
            amount: "total",
            category: "group",
            customerId: ""
        });

        expect(profile.unmappedColumnCount).toBe(1);
        expect(profile.mappedFields).not.toHaveProperty("customerId");
        expect(profile.mappedFields).not.toHaveProperty("orderId");
        expect(profile.mappedFields.category).toEqual({
            column: "group",
            missingCount: 1,
            nonemptyCount: 0,
            distinctNonemptyCount: 0
        });
    });
});
