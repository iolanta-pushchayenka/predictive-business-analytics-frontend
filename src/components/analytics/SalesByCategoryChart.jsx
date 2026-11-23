import {
    ResponsiveContainer,
    BarChart,
    Bar,
    Rectangle,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    LabelList
} from "recharts";

import "./SalesByCategoryChart.css";

const BAR_COLORS = ["#B59ACF", "#9672B8", "#7950A3"];

// Format exact revenue values for tooltips.
function formatRevenue(value) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2
    }).format(value);
}

// Format large values for chart axes and labels.
function formatCompact(value) {
    const abs = Math.abs(value);

    if (abs >= 1000000) {
        return `${(value / 1000000).toFixed(1)}m`;
    }

    if (abs >= 1000) {
        return `${Math.round(value / 1000)}k`;
    }

    return formatRevenue(value);
}

// Draw a bar with the color assigned to its category.
function CategoryBar(props) {
    return <Rectangle {...props} fill={props.payload?.color ?? BAR_COLORS[0]} />;
}

// Display the revenue calculated for each product category.
export default function SalesByCategoryChart({ data = [] }) {
    const hasData = data.length > 0;

    const chartData = data.map((item, index) => ({
        ...item,
        color: BAR_COLORS[index % BAR_COLORS.length]
    }));

    // Keep bars readable when the CSV contains many categories.
    const chartWidth = Math.max(0, chartData.length * 125);

    return (
        <article className="sales-category-card">
            <div className="sales-category-heading">
                <h2>Sales by Category</h2>
                <p>Revenue by product category</p>
            </div>

            <div className="sales-category-chart">
                {hasData ? (
                    <div className="sales-category-scroll">
                        <div
                            className="sales-category-chart-inner"
                            style={{ minWidth: chartWidth }}
                        >
                            <span className="sales-category-axis-title">Revenue</span>

                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{
                                        top: 30,
                                        right: 8,
                                        left: 0,
                                        bottom: 18
                                    }}
                                    barCategoryGap="40%"
                                >
                                    <CartesianGrid stroke="#EEEAF3" vertical={false} />

                                    <XAxis
                                        dataKey="category"
                                        tick={{
                                            fontSize: 12,
                                            fill: "#79717F"
                                        }}
                                        tickLine={false}
                                        axisLine={false}
                                        interval={0}
                                        height={35}
                                        tickFormatter={(name) =>
                                            name.length > 15 ? `${name.slice(0, 13)}…` : name
                                        }
                                    />

                                    <YAxis
                                        width={48}
                                        tickFormatter={formatCompact}
                                        tick={{
                                            fontSize: 10,
                                            fill: "#79717F"
                                        }}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[
                                            (dataMin) => Math.min(0, dataMin),
                                            (dataMax) => Math.max(0, dataMax)
                                        ]}
                                    />

                                    <Tooltip
                                        formatter={(value) => [formatRevenue(value), "Revenue"]}
                                    />

                                    <Bar
                                        dataKey="revenue"
                                        shape={CategoryBar}
                                        maxBarSize={74}
                                        radius={[6, 6, 0, 0]}
                                        isAnimationActive={false}
                                    >
                                        <LabelList
                                            dataKey="revenue"
                                            position="top"
                                            formatter={formatCompact}
                                            style={{
                                                fill: "#665275",
                                                fontSize: 11,
                                                fontWeight: 500
                                            }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <p className="sales-category-empty">No valid category sales data available.</p>
                )}
            </div>

            {hasData && <p className="sales-category-axis-caption">Product category</p>}
        </article>
    );
}
