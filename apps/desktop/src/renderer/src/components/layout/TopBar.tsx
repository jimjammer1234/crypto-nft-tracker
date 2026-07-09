import { NavLink } from "react-router-dom";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? "bg-elevated text-blue-400" : "text-gray-400 hover:bg-elevated hover:text-white"
  }`;

// Electron's hiddenInset title bar doesn't make any region draggable by default — this has to be
// opted into explicitly, and interactive children have to opt back out or they stop receiving clicks.
const dragStyle = { WebkitAppRegion: "drag" } as React.CSSProperties;
const noDragStyle = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function TopBar() {
  return (
    <header
      className="flex items-center justify-between border-b border-border bg-surface py-3 pl-20 pr-6"
      style={dragStyle}
    >
      <div className="text-lg font-semibold text-purple-400">Crypto &amp; NFT Tracker</div>
      <nav className="flex gap-1" style={noDragStyle}>
        <NavLink to="/" end className={navClass}>
          Home
        </NavLink>
        <NavLink to="/alerts" className={navClass}>
          Alerts
        </NavLink>
        <NavLink to="/settings" className={navClass}>
          Settings
        </NavLink>
      </nav>
    </header>
  );
}
