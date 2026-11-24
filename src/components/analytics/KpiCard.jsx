import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import "./KpiCard.css";

// Display a business KPI and its calculated monthly change.
export default function KpiCard({ title, value, change }) {
    const hasChange = change !== null && change !== undefined && change !== "" && change !== "N/A";

    const isPositive = hasChange && String(change).startsWith("+");
    const isNegative = hasChange && String(change).startsWith("-");

    const trend = isPositive ? "positive" : isNegative ? "negative" : "neutral";

    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

    return (
        <article className="kpi-card">
            <div className="kpi-card-main">
                <p className="kpi-card-title">{title}</p>

                <p className="kpi-card-value" title={value != null ? String(value) : undefined}>
                    {value ?? "Not available"}
                </p>
            </div>

            <div className="kpi-card-footer">
                {hasChange ? (
                    <>
                        <div className={`kpi-card-change kpi-change-${trend}`}>
                            <TrendIcon size={20} strokeWidth={2.5} aria-hidden="true" />

                            <span>{change}</span>
                        </div>

                        <p className="kpi-card-caption">Monthly change</p>
                    </>
                ) : (
                    <p className="kpi-card-caption">Monthly change unavailable</p>
                )}
            </div>
        </article>
    );
}
