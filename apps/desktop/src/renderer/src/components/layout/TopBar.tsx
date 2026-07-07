import { NavLink } from "react-router-dom";

export function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
      <div className="text-lg font-semibold text-purple-400">Crypto &amp; NFT Tracker</div>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            isActive ? "bg-elevated text-blue-400" : "text-gray-400 hover:bg-elevated hover:text-white"
          }`
        }
      >
        Settings
      </NavLink>
    </header>
  );
}
