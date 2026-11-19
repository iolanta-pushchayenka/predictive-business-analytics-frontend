import { Component } from "react";

// Catch rendering errors in child React components.
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);

        this.state = { hasError: false };
    }

    // Update state when a child component throws an error.
    static getDerivedStateFromError() {
        return { hasError: true };
    }

    // Log the error for debugging.
    componentDidCatch(error, info) {
        console.error("React rendering error:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <main role="alert">
                    <h1>Something went wrong</h1>
                    <p>An unexpected error occurred. Please try reloading the page.</p>

                    <button onClick={() => window.location.reload()}>Reload page</button>
                </main>
            );
        }

        return this.props.children;
    }
}
