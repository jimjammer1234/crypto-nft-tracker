import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-4 ${className}`}>{children}</div>
  );
}

export function StatCard({
  label,
  value,
  accent = "purple",
  sub,
}: {
  label: string;
  value: string;
  accent?: "purple" | "blue" | "yellow";
  sub?: string;
}) {
  const accentClass = { purple: "text-purple-400", blue: "text-blue-400", yellow: "text-yellow-400" }[accent];
  return (
    <Card>
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${accentClass}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </Card>
  );
}
