import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import "../css/Form.css";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Handle registration form submission
    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await register(email, password);
            navigate("/home", { replace: true });
        } catch (error) {
            setError(error.message || "Failed to register");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1 className="auth-title">
                    Create an account
                </h1>

                <p className="auth-description">
                    Get started with Business Analytics
                </p>

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
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={128}
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
                    {loading ? "Creating account..." : "Register"}
                </button>

                <p className="auth-footer">
                    Already have an account?{" "}
                    <Link className="auth-link" to="/login">
                        Log in
                    </Link>
                </p>
            </form>
        </main>
    );
}
