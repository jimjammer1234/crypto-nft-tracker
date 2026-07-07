import type { ReactNode } from "react";

export function PageShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <h1 className="mb-5 text-xl font-semibold text-white">{title}</h1>
      {children}
    </div>
  );
}
