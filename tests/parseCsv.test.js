import { describe, expect, it } from "vitest";
import { parseCsv } from "../src/utils/parseCsv.js";

describe("parseCsv", () => {
    it("returns parsed records and metadata without coercing values", async () => {
        const result = await parseCsv(new Blob(["\uFEFFdate;amount\r\n\r\n2026-11-01;001.25"]));

        expect(result).toEqual({
            columns: ["date", "amount"],
            rows: [{ date: "2026-11-01", amount: "001.25" }],
            renamedHeaders: null,
            meta: { delimiter: ";", linebreak: "\r\n", truncated: false },
            structuralDiagnostics: []
        });
    });

    it.each([
        ["", /empty or has no header/i],
        ["\n\n", /empty or has no header/i],
        ["date,amount\n", /no data rows/i],
        ["date,\na,1", /column 2 is blank/i],
        ["date,  \na,1", /column 2 is blank/i],
        ["date,date\na,1", /duplicate CSV header.*date/i],
        ["date, date \na,1", /duplicate CSV header.*date/i],
        ["date,amount\na,1\nb", /record 2 has 1 fields.*expected 2/i],
        ["date,amount\na,1\nb,2,3", /record 2 has 3 fields.*expected 2/i],
        ['date,amount\na,"1', /unterminated/i],
        ['date,amount\n"a"x,1', /malformed/i],
        ['date,amount\na,1"2', /misplaced quote/i],
        ["date\na", /at least two columns/i]
    ])("rejects invalid structure for both full and preview parsing (%#)", async (csv, message) => {
        await expect(parseCsv(csv)).rejects.toThrow(message);
        await expect(parseCsv(csv, { previewRows: 5 })).rejects.toThrow(message);
    });

    it("treats special object and parser names as ordinary columns", async () => {
        const { columns, rows } = await parseCsv("date,amount,__parsed_extra,__proto__\na,1,x,y");

        expect(columns).toEqual(["date", "amount", "__parsed_extra", "__proto__"]);
        expect(rows[0].__parsed_extra).toBe("x");
        expect(Object.hasOwn(rows[0], "__proto__")).toBe(true);
        expect(rows[0].__proto__).toBe("y");
    });

    it("skips technical blank lines and retains field-bearing records", async () => {
        const { rows } = await parseCsv('\ndate,amount\n\na,1\n,\n"",2\n ,3\n');

        expect(rows).toEqual([
            { date: "a", amount: "1" },
            { date: "", amount: "" },
            { date: "", amount: "2" },
            { date: " ", amount: "3" }
        ]);
    });

    it("checks the width of a quoted empty record instead of treating it as a blank line", async () => {
        await expect(parseCsv('date,amount\n\n""')).rejects.toThrow(/record 1 has 1 fields/i);
    });

    it("counts only records towards the preview limit and checks the remainder on full parse", async () => {
        const csv = "date,amount\n\na,1\n\nb,2\n\nbroken";
        const preview = await parseCsv(csv, { previewRows: 2 });

        expect(preview.rows).toEqual([
            { date: "a", amount: "1" },
            { date: "b", amount: "2" }
        ]);
        expect(preview.meta.truncated).toBe(true);
        await expect(parseCsv(csv)).rejects.toThrow(/record 3 has 1 fields/i);
    });

    it("preserves quoted delimiters, escaped quotes and multiline fields", async () => {
        const { rows } = await parseCsv('date,amount,note\na,12,"one, ""two""\n\nthree"\n');

        expect(rows).toEqual([{ date: "a", amount: "12", note: 'one, "two"\n\nthree' }]);
    });

    it("rejects invalid preview options and unreadable files", async () => {
        await expect(parseCsv("date,amount\na,1", { previewRows: -1 })).rejects.toThrow(
            "Invalid preview row count"
        );
        await expect(
            parseCsv({ text: () => Promise.reject(new Error("read failed")) })
        ).rejects.toThrow("Failed to read CSV file");
    });
});
