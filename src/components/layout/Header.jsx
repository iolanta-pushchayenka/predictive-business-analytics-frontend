
import { Menu } from "lucide-react";

// Display the current workspace page and mobile navigation button.
export default function Header({ pageTitle, onMenuClick, isMenuOpen }) {
  return (
    <header className="app-header">
      <button
        type="button"
        className="app-header-menu"
        onClick={onMenuClick}
        aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isMenuOpen}
        aria-controls="workspace-sidebar"
      >
        <Menu size={22} aria-hidden="true" />
      </button>

      <div className="app-header-title">
        <span className="app-header-label">Workspace</span>
        <h1>{pageTitle}</h1>
      </div>
    </header>
  );
}
