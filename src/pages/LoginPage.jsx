import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import "../css/Form.css";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Handle login form submission
    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await login(email, password);
            navigate("/upload", { replace: true });
        } catch (error) {
            setError(error.message || "Failed to log in");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1 className="auth-title">Welcome back</h1>

                <p className="auth-description">Log in to your Business Analytics account</p>

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
                        onChange={(event) => setEmail(event.target.value)}
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
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                    />
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
                    {loading ? "Logging in..." : "Log in"}
                </button>

                <p className="auth-footer">
                    Don't have an account?{" "}
                    <Link className="auth-link" to="/register">
                        Create account
                    </Link>
                </p>
            </form>
        </main>
    );
}
