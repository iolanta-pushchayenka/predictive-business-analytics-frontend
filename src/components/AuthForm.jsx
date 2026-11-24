import { Link } from "react-router-dom";

// Render shared authentication fields and submit button.
export default function AuthForm({
    title,
    description,
    email,
    password,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    error,
    loading,
    submitText,
    loadingText,
    footerText,
    footerLinkText,
    footerLinkTo,
    isRegister = false
}) {
    return (
        <main className="auth-page">
            <form className="auth-card" onSubmit={onSubmit}>
                <h1 className="auth-title">{title}</h1>

                <p className="auth-description">{description}</p>

                <div className="auth-fields">
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="email">
                            Email
                        </label>

                        <input
                            className="auth-input"
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(event) => onEmailChange(event.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="password">
                            Password
                        </label>

                        <input
                            className="auth-input"
                            id="password"
                            type="password"
                            placeholder={
                                isRegister ? "At least 8 characters" : "Enter your password"
                            }
                            value={password}
                            onChange={(event) => onPasswordChange(event.target.value)}
                            autoComplete={isRegister ? "new-password" : "current-password"}
                            minLength={isRegister ? 8 : undefined}
                            maxLength={isRegister ? 128 : undefined}
                            required
                        />
                    </div>
                </div>

                {error && (
                    <p role="alert" className="auth-error">
                        {error}
                    </p>
                )}

                <button
                    className="auth-button"
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                >
                    {loading ? loadingText : submitText}
                </button>

                <p className="auth-footer">
                    {footerText}{" "}
                    <Link className="auth-link" to={footerLinkTo}>
                        {footerLinkText}
                    </Link>
                </p>
            </form>
        </main>
    );
}
