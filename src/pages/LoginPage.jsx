import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthForm from "../components/AuthForm";
import "../css/Form.css";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Authenticate the user and redirect to the upload page.
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
        <AuthForm
            title="Welcome back"
            description="Log in to your Business Analytics account"
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
            error={error}
            loading={loading}
            submitText="Log in"
            loadingText="Logging in..."
            footerText="Don't have an account?"
            footerLinkText="Create account"
            footerLinkTo="/register"
        />
    );
}
