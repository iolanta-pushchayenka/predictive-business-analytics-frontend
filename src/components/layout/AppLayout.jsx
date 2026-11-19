import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "../../css/Layout.css";

const pageTitles = {
    "/": "Dashboard",
    "/upload": "Upload data",
    "/analysis": "Analysis",
    "/history": "History",
    "/settings": "Settings"
};

// Render the shared layout for authenticated workspace pages.
export default function AppLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const pageTitle = pageTitles[location.pathname] || "Workspace";

    // Close the mobile menu using the Escape key.
    useEffect(() => {
        if (!isSidebarOpen) return;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isSidebarOpen]);

    return (
        <div className="app-layout">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="app-main">
                <Header
                    pageTitle={pageTitle}
                    isMenuOpen={isSidebarOpen}
                    onMenuClick={() => setIsSidebarOpen((open) => !open)}
                />

                <main className="app-content" id="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
