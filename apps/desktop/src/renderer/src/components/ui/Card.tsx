import type { ReactNode } from "react";

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
    <div className={`rounded-xl border border-border bg-surface p-4 ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
