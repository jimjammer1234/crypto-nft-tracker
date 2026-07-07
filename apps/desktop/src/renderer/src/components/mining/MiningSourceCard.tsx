import type { MiningSourceRow } from "../../lib/apiClient.js";
import { useMiningSnapshots } from "../../hooks/useMiningData.js";
import { formatHashrate, formatRelativeTime } from "../../lib/format.js";
import { Card } from "../ui/Card.js";

export function MiningSourceCard({ source }: { source: MiningSourceRow }) {
  const snapshots = useMiningSnapshots(source.id, 1);
  const latest = snapshots[0];
  const hashrate = latest?.hashrate1hr ?? latest?.hashrate1m ?? null;
  const isStale = latest?.lastShareAt ? Date.now() - new Date(latest.lastShareAt).getTime() > 30 * 60_000 : false;

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="text-sm font-medium text-white">{source.label}</div>
        <span className={`h-2 w-2 rounded-full ${isStale ? "bg-yellow-500" : "bg-green-500"}`} title={isStale ? "stale" : "active"} />
      </div>
      <div className="mt-2 text-2xl font-semibold text-purple-400">{formatHashrate(hashrate)}</div>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>{latest?.workersOnline ?? "—"} workers</span>
        <span>{formatRelativeTime(latest?.lastShareAt)}</span>
      </div>
    </Card>
  );
}
