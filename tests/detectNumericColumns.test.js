import { describe, expect, it } from "vitest";
import { detectNumericColumns } from "../src/utils/detectNumericColumns";

describe("detectNumericColumns", () => {
    it("detects sales and other numeric business columns", () => {
        const columns = [
            "Row ID",
            "Order Date",
            "Customer ID",
            "Sales",
            "Quantity",
            "Discount",
            "Profit",
            "Category",
            "Postal Code"
        ];

        const rows = Array.from({ length: 10 }, (_, index) => ({
            "Row ID": String(index + 1),
            "Order Date": "2024-01-15",
            "Customer ID": `C-${index}`,
            Sales: String(100 + index),
            Quantity: String(index + 1),
            Discount: String(index / 100),
            Profit: String(20 + index),
            Category: "Furniture",
            "Postal Code": "10001"
        }));

        const mapping = {
            date: "Order Date",
            amount: "Sales",
            customerId: "Customer ID",
            category: "Category"
        };

        const detected = detectNumericColumns(columns, rows, mapping);

        console.log("Detected numeric columns:", detected);

        expect(detected).toEqual(["Sales", "Quantity", "Discount", "Profit"]);

        expect(detectNumericColumns(columns, rows, mapping)).toEqual([
            "Sales",
            "Quantity",
            "Discount",
            "Profit"
        ]);
    });

    it("excludes nonnumeric and constant columns", () => {
        const columns = ["Sales", "Region", "Constant"];

        const rows = [
            { Sales: "10", Region: "East", Constant: "1" },
            { Sales: "20", Region: "West", Constant: "1" },
            { Sales: "30", Region: "East", Constant: "1" }
        ];

        expect(detectNumericColumns(columns, rows)).toEqual(["Sales"]);
    });

    it("returns an empty array when no numeric columns exist", () => {
        const columns = ["Name", "Region"];

        const rows = [
            { Name: "A", Region: "East" },
            { Name: "B", Region: "West" }
        ];

        expect(detectNumericColumns(columns, rows)).toEqual([]);
    });
});
