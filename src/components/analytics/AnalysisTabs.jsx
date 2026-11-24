import { BarChart3, TrendingUp, Users } from "lucide-react";
import "./AnalysisTabs.css";

const tabs = [
    {
        id: "eda",
        label: "Exploratory Analysis",
        Icon: BarChart3
    },
    {
        id: "forecasts",
        label: "Sales Forecasts",
        Icon: TrendingUp
    },
    {
        id: "segmentation",
        label: "Customer Segmentation",
        Icon: Users
    }
];

// Display navigation between the three analysis sections.
export default function AnalysisTabs({ activeTab, onChange }) {
    return (
        <nav className="analysis-tabs" aria-label="Analysis sections">
            {tabs.map(({ id, label, Icon }) => (
                <button
                    key={id}
                    type="button"
                    className={`analysis-tab ${activeTab === id ? "is-active" : ""}`}
                    onClick={() => onChange(id)}
                    aria-current={activeTab === id ? "page" : undefined}
                    aria-label={label}
                    title={label}
                >
                    <Icon size={20} aria-hidden="true" />

                    <span className="analysis-tab-label">{label}</span>
                </button>
            ))}
        </nav>
    );
}
