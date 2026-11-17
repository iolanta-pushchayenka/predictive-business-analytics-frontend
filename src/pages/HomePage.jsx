import { useNavigate, Link} from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function HomePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Clear authentication state and redirect to Login
    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <main>
            <h1>Welcome to Business Analytics!</h1>

            <p>You are successfully logged in.</p>
            <p>Your email: {user.email}</p>

            <p>Analytics dashboard coming soon.</p>

            <Link to="/upload">Upload CSV</Link>

            <button type="button" onClick={handleLogout}>
                Log out
            </button>
        </main>
    );
}
