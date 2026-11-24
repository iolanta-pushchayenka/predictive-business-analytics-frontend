import { DATE_FORMATS } from "../utils/normalizeDate";
import { AMOUNT_FORMATS } from "../utils/normalizeAmount";
import "./DataFormatSettings.css";

// Display configurable date and amount formats for the CSV dataset.
export default function DataFormatSettings({ formats, onChange, disabled = false }) {
    // Update a format setting while preserving other selections.
    function handleChange(field, value) {
        onChange({
            ...formats,
            [field]: field === "twoDigitYearCentury" ? Number(value) : value
        });
    }

    const exampleYear = Number(formats.twoDigitYearCentury) === 1900 ? 1926 : 2026;

    return (
        <section className="data-formats" aria-labelledby="data-formats-title">
            <div className="data-formats-header">
                <h2 id="data-formats-title">Data Format Settings</h2>

                <p>Specify how dates and numeric values should be interpreted in your CSV file.</p>
            </div>

            <div className="data-formats-grid">
                <div className="data-formats-field">
                    <label className="data-formats-label" htmlFor="date-format">
                        Date format
                        <span className="data-formats-required"> *</span>
                    </label>

                    <select
                        className="data-formats-select"
                        id="date-format"
                        value={formats.date}
                        onChange={(event) => handleChange("date", event.target.value)}
                        disabled={disabled}
                        required
                    >
                        <option value="">Select date format</option>
                        <option value={DATE_FORMATS.DMY_SLASH}>DD/MM/YYYY or DD/MM/YY</option>
                        <option value={DATE_FORMATS.MDY_SLASH}>MM/DD/YYYY or MM/DD/YY</option>
                        <option value={DATE_FORMATS.YMD_DASH}>YYYY-MM-DD</option>
                        <option value={DATE_FORMATS.DMY_DOT}>DD.MM.YYYY or DD.MM.YY</option>
                        <option value={DATE_FORMATS.YMD_SLASH}>YYYY/MM/DD</option>
                    </select>
                </div>

                <div className="data-formats-field">
                    <label className="data-formats-label" htmlFor="amount-format">
                        Amount format
                        <span className="data-formats-required"> *</span>
                    </label>

                    <select
                        className="data-formats-select"
                        id="amount-format"
                        value={formats.amount}
                        onChange={(event) => handleChange("amount", event.target.value)}
                        disabled={disabled}
                        required
                    >
                        <option value="">Select amount format</option>
                        <option value={AMOUNT_FORMATS.DOT}>1234.56</option>
                        <option value={AMOUNT_FORMATS.US}>1,234.56</option>
                        <option value={AMOUNT_FORMATS.EU_DOT}>1.234,56</option>
                        <option value={AMOUNT_FORMATS.EU_SPACE}>1 234,56</option>
                        <option value={AMOUNT_FORMATS.COMMA}>1234,56</option>
                    </select>
                </div>

                <div className="data-formats-field">
                    <label className="data-formats-label" htmlFor="year-century">
                        Century for two-digit years
                    </label>

                    <select
                        className="data-formats-select"
                        id="year-century"
                        value={formats.twoDigitYearCentury}
                        onChange={(event) =>
                            handleChange("twoDigitYearCentury", event.target.value)
                        }
                        disabled={disabled}
                    >
                        <option value={2000}>2000–2099</option>
                        <option value={1900}>1900–1999</option>
                    </select>
                </div>
            </div>

            <div className="data-formats-notice">
                <div className="data-formats-notice-icon" aria-hidden="true">
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path d="M7 3v4M17 3v4M3 10h18" />
                    </svg>
                </div>

                <div>
                    <p className="data-formats-notice-title">Your date interpretation</p>

                    <p className="data-formats-notice-text">
                        Two-digit year 26 is interpreted as {exampleYear}. Four-digit years are not
                        affected.
                    </p>
                </div>
            </div>
        </section>
    );
}
