import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/ProtectedRoute";

// Load pages only when their routes are opened.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const HomePage = lazy(() => import("./pages/HomePage"));
const UploadPage = lazy(() => import("./pages/UploadPage"));
const AnalysisPage = lazy(() => import("./pages/AnalysisPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));

// Load the authenticated workspace layout separately.
const AppLayout = lazy(() => import("./components/layout/AppLayout"));

// Display a fallback while a page's JavaScript is loading.
function PageFallback() {
    return (
        <div role="status" style={{ padding: "24px" }}>
            Loading page...
        </div>
    );
}

function App() {
    return (
        <>
            <Suspense fallback={<PageFallback />}>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />

                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route element={<AppLayout />}>
                        <Route element={<ProtectedRoute />}>
                            <Route path="/home" element={<HomePage />} />
                            <Route path="/upload" element={<UploadPage />} />
                            <Route path="/analysis" element={<AnalysisPage />} />
                            <Route path="/history" element={<HistoryPage />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<h1>404 - Page not found</h1>} />
                </Routes>
            </Suspense>
        </>
    );
}

export default App;
