import type { ReactNode } from "react";

// Cards sit inside the window's draggable background region; without this they'd inherit
// -webkit-app-region: drag and clicking one would move the window instead of firing onClick.
const noDragStyle = { WebkitAppRegion: "no-drag" } as React.CSSProperties;

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 ${className}`}
      style={noDragStyle}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
