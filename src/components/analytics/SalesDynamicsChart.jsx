import {
    ResponsiveContainer,
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip
} from "recharts";

import "./SalesDynamicsChart.css";

// Format numeric values for chart labels.
function formatRevenue(value) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2
    }).format(value);
}

// Format large values on the vertical axis.
function formatAxisValue(value) {
    const absolute = Math.abs(value);

    if (absolute >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }

    if (absolute >= 1000) {
        return `${(value / 1000).toFixed(0)}k`;
    }

    return String(value);
}

// Display monthly sales trends from prepared CSV data.
export default function SalesDynamicsChart({ data }) {
    const hasData = Array.isArray(data) && data.length > 0;

    return (
        <article className="sales-dynamics-card">
            <div className="sales-dynamics-heading">
                <div className="sales-dynamics-title-row">
                    <h2>Sales Dynamics</h2>

                    <span className="sales-dynamics-period">Monthly</span>
                </div>

                <p>Revenue trends over time</p>
            </div>

            <div className="sales-dynamics-chart">
                {hasData ? (
                    <>
                        <span className="sales-dynamics-axis-title">Revenue</span>

                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={data}
                                margin={{
                                    top: 26,
                                    right: 10,
                                    left: 0,
                                    bottom: 12
                                }}
                            >
                                <CartesianGrid stroke="#EEEAF3" vertical={false} />

                                <XAxis
                                    dataKey="month"
                                    tickFormatter={(month) =>
                                        new Date(`${month}-01T00:00:00`).toLocaleDateString(
                                            "en-US",
                                            {
                                                month: "short"
                                            }
                                        )
                                    }
                                    tick={{
                                        fontSize: 11,
                                        fill: "#79717F"
                                    }}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={12}
                                />

                                <YAxis
                                    width={48}
                                    tickFormatter={formatAxisValue}
                                    tick={{
                                        fontSize: 10,
                                        fill: "#79717F"
                                    }}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[(dataMin) => Math.min(0, dataMin), "auto"]}
                                />

                                <Tooltip
                                    formatter={(value) => [formatRevenue(value), "Revenue"]}
                                    labelFormatter={(month) => month}
                                />

                                <Line
                                    type="linear"
                                    dataKey="revenue"
                                    stroke="#7950A3"
                                    strokeWidth={2.5}
                                    dot={{
                                        r: 3,
                                        fill: "#FFFFFF",
                                        stroke: "#7950A3",
                                        strokeWidth: 1.5
                                    }}
                                    activeDot={{ r: 5 }}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </>
                ) : (
                    <p className="sales-dynamics-empty">
                        No valid sales data available for this chart.
                    </p>
                )}
            </div>
        </article>
    );
}
