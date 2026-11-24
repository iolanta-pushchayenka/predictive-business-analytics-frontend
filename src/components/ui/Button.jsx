import "./Button.css";

// Render a reusable button with consistent styles.
export default function Button({
    children,
    variant = "primary",
    type = "button",
    loading = false,
    disabled = false,
    arrow = null,
    onClick,
    className = "",
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={`ui-button ui-button--${variant} ${className}`.trim()}
            onClick={onClick}
            disabled={disabled || loading}
            aria-busy={loading}
        >
            {arrow === "left" && <span aria-hidden="true">←</span>}

            <span>{children}</span>

            {arrow === "right" && <span aria-hidden="true">→</span>}
            {/* 
            {showArrow && !loading && (
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                </svg>
            )} */}
        </button>
    );
}
