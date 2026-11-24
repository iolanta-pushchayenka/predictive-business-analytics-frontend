import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import "./SalesDistributionChart.css";

// Display the distribution of validated sales amounts.
export default function SalesDistributionChart({ data = [] }) {
    return (
        <section className="sales-distribution-card" aria-labelledby="sales-distribution-title">
            <div className="sales-distribution-header">
                <h2 id="sales-distribution-title">Sales Distribution</h2>

                <p>Frequency of sales amounts</p>
            </div>

            {!data.length ? (
                <p className="sales-distribution-empty">
                    Sales distribution is not available for this dataset.
                </p>
            ) : (
                <div
                    className="sales-distribution-plot"
                    role="img"
                    aria-label="Distribution of sales amounts, including high-value sales"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 20,
                                right: 12,
                                bottom: 20,
                                left: 0
                            }}
                        >
                            <CartesianGrid stroke="#eeeaf3" vertical={false} />

                            <XAxis
                                dataKey="axisLabel"
                                tick={{
                                    fontSize: 11,
                                    fill: "#79717f"
                                }}
                                interval="preserveStartEnd"
                                minTickGap={15}
                                angle={0}
                                height={40}
                            />

                            <YAxis
                                allowDecimals={false}
                                tick={{
                                    fontSize: 11,
                                    fill: "#79717f"
                                }}
                                width={45}
                            />

                            <Tooltip
                                labelFormatter={(_, payload) => payload?.[0]?.payload?.range ?? ""}
                                formatter={(value) => [
                                    Number(value).toLocaleString("en-US"),
                                    "Records"
                                ]}
                            />

                            <Bar
                                dataKey="count"
                                name="Records"
                                fill="#9672b8"
                                radius={[4, 4, 0, 0]}
                                maxBarSize={85}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}
