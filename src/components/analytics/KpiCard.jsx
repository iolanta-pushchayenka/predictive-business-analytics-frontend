import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import "./KpiCard.css";

// Display a KPI value and its monthly change.
export default function KpiCard({ title, value, change }) {
    const isPositive = change?.startsWith("+");
    const isNegative = change?.startsWith("-");

    const trend = isPositive ? "positive" : isNegative ? "negative" : "neutral";

    const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

    return (
        <article className="kpi-card">
            <p className="kpi-card-title">{title}</p>

            <p className="kpi-card-value">{value ?? "Not available"}</p>

            <div className="kpi-card-footer">
                <div className={`kpi-card-change kpi-change-${trend}`}>
                    <TrendIcon size={30} strokeWidth={2.5} aria-hidden="true" />
                    <span>{change ?? "N/A"}</span>
                </div>

                <p className="kpi-card-caption">Monthly change</p>
            </div>
        </article>
    );
}
