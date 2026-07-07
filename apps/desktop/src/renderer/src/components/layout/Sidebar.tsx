import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/mining", label: "Mining" },
  { to: "/nft", label: "NFTs" },
  { to: "/settings", label: "Settings" },
];

export function Sidebar() {
  return (
    <nav className="flex h-full w-52 flex-col gap-1 border-r border-border bg-surface p-3">
      <div className="mb-4 px-2 text-lg font-semibold text-purple-400">Tracker</div>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? "bg-elevated text-blue-400" : "text-gray-400 hover:bg-elevated hover:text-white"
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
