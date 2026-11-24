import { useNavigate } from "react-router-dom";
import "../css/HomePage.css";

export default function HomePage() {
    const navigate = useNavigate();

    return (
        <main>
            <h1>Welcome to Business Analytics!</h1>
            <button className="csv-upload-button" onClick={() => navigate("/upload")}>
                Upload CSV file
            </button>
        </main>
    );
}
