import { PageShell } from "../components/layout/PageShell.js";
import { Card } from "../components/ui/Card.js";

export function Settings() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string;

  return (
    <PageShell title="Settings">
      <Card className="max-w-xl">
        <div className="text-xs uppercase text-gray-400">Backend</div>
        <div className="mt-1 text-sm text-white">{baseUrl}</div>

        <div className="mt-4 text-xs uppercase text-gray-400">Notes</div>
        <ul className="mt-1 list-disc pl-4 text-sm text-gray-400">
          <li>Alert thresholds and rule editing are coming in a later update.</li>
          <li>The OpenSea API key currently in use is a temporary agent-issued key expiring 2026-08-06.</li>
        </ul>
      </Card>
    </PageShell>
  );
}
