
export const COLUMN_ALIASES = {
    date: [
        "date",
        "order date",
        "transaction date",
        "purchase date",
        "sale date"
    ],

    amount: [
        "amount",
        "sales",
        "revenue",
        "total",
        "sales amount"
    ],

    customerId: [
        "customer id",
        "client id",
        "buyer id"
    ],

    orderId: [
        "order id",
        "transaction id",
        "invoice id"
    ],

    category: [
        "category",
        "product category"
    ]
};

// Normalize a CSV column name for comparison
export function normalizeColumnName(name) {
    return name.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

// Detect matching CSV columns using predefined aliases
export function detectColumnMapping(columns) {
    const mapping = {
        date: "",
        amount: "",
        customerId: "",
        orderId: "",
        category: ""
    };

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
        const matches = columns.filter((column) =>
            aliases.some((alias) =>
                normalizeColumnName(column) === normalizeColumnName(alias)
            )
        );

        // Avoid choosing a column when multiple matches are found
        if (matches.length === 1) {
            mapping[field] = matches[0];
        }
    }

    return mapping;
}
