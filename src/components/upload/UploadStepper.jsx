
const steps = [
    "Upload File",
    "Column Mapping",
    "Data Formats",
    "Validation",
];

// Display the current step of CSV data preparation
export default function UploadStepper({ currentStep }) {
    return (
        <nav className="upload-stepper" aria-label="Data preparation progress">
            <ol className="upload-stepper-list">
                {steps.map((step, index) => {
                    const stepNumber = index + 1;
                    const completed = stepNumber < currentStep;
                    const active = stepNumber === currentStep;

                    return (
                        <li
                            key={step}
                            className={`upload-stepper-item ${
                                active ? "is-active" : ""
                            } ${completed ? "is-completed" : ""}`}
                            aria-current={active ? "step" : undefined}
                        >
                            <span className="upload-stepper-number">
                                {completed ? "✓" : stepNumber}
                            </span>

                            <span className="upload-stepper-label">
                                {step}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
