import { DATE_FORMATS } from "../utils/normalizeDate";
import { AMOUNT_FORMATS } from "../utils/normalizeAmount";

// Display the format settings for the selected CSV columns
export default function DataFormatSettings({ formats, onChange, disabled = false }) {
    // Update a format setting
    function handleChange(field, value) {
        onChange({
            ...formats,
            [field]: field === "twoDigitYearCentury" ? Number(value) : value
        });
    }

    return (
        <section className="data-formats">
            <div className="data-formats-header">
                <h2>Data Format Settings</h2>

                <p>Select the formats used in your CSV file.</p>
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

                    <p className="data-formats-help">
                        Example: with 2000–2099 selected, the year 26 means 2026. Four-digit years
                        are not affected.
                    </p>
                </div>
            </div>
        </section>
    );
}
