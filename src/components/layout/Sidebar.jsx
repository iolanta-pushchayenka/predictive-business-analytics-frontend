
import { NavLink } from "react-router-dom";
import {
  ChartNoAxesColumnIncreasing,
  LayoutDashboard,
  Upload,
  ChartColumnIncreasing,
  History,
  Settings,
  X
} from "lucide-react";

// Navigation items for the application workspace.
// Only existing pages are enabled.
const navigationItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard, enabled: false },
  { label: "Upload data", path: "/upload", icon: Upload, enabled: true },
  { label: "Analysis", path: "/analysis", icon: ChartColumnIncreasing, enabled: false },
  { label: "History", path: "/history", icon: History, enabled: false },
  { label: "Settings", path: "/settings", icon: Settings, enabled: false }
];

// Display workspace navigation and highlight the active page.
export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="app-sidebar-overlay"
          onClick={onClose}
          aria-label="Close navigation"
          tabIndex={-1}
        />
      )}

      <aside
        id="workspace-sidebar"
        className={`app-sidebar ${isOpen ? "app-sidebar--open" : ""}`}
        aria-label="Workspace navigation"
      >
        <div className="app-sidebar-brand">
          <div className="app-brand-icon">
            <ChartNoAxesColumnIncreasing size={23} aria-hidden="true" />
          </div>

          <span className="app-brand-name">
            Business <span>Analytics</span>
          </span>

          <button
            type="button"
            className="app-sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className="app-sidebar-nav" aria-label="Main navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            if (!item.enabled) {
              return (
                <div
                  key={item.label}
                  className="app-nav-item app-nav-item--disabled"
                  aria-disabled="true"
                  title="Coming soon"
                >
                  <Icon size={20} aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
              );
            }

            return (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.path === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  `app-nav-item ${isActive ? "app-nav-item--active" : ""}`
                }
              >
                <Icon size={20} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
