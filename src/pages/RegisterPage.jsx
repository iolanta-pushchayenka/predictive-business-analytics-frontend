import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import AuthForm from "../components/AuthForm";
import "../css/Form.css";

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Register the user and redirect to the upload page.
    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            await register(email, password);
            navigate("/upload", { replace: true });
        } catch (error) {
            setError(error.message || "Failed to register");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthForm
            title="Create an account"
            description="Get started with Business Analytics"
            email={email}
            password={password}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
            error={error}
            loading={loading}
            submitText="Register"
            loadingText="Creating account..."
            footerText="Already have an account?"
            footerLinkText="Log in"
            footerLinkTo="/login"
            isRegister
        />
    );
}
