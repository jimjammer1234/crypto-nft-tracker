import type { MiningSourceRow } from "../../lib/apiClient.js";
import { useMiningSnapshots } from "../../hooks/useMiningData.js";
import { formatHashrate, formatRelativeTime } from "../../lib/format.js";
import { Sparkline } from "../ui/Sparkline.js";
import { Card } from "../ui/Card.js";

export function MiningWidget({ source }: { source: MiningSourceRow }) {
  const snapshots = useMiningSnapshots(source.id, 40);
  const latest = snapshots[0];
  const hashrate = latest?.hashrate1hr ?? latest?.hashrate1m ?? null;
  const isStale = latest?.lastShareAt ? Date.now() - new Date(latest.lastShareAt).getTime() > 30 * 60_000 : false;

  const chartData = [...snapshots]
    .reverse()
    .map((s) => ({ x: s.polledAt, y: Number(s.hashrate1hr ?? s.hashrate1m ?? 0) }));

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-white">{source.label}</div>
          <div className="text-xs text-gray-500">{source.coin}</div>
        </div>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${isStale ? "bg-yellow-500" : "bg-green-500"}`}
          title={isStale ? "stale" : "active"}
        />
      </div>

      <div className="mt-3 text-2xl font-semibold text-purple-400">{formatHashrate(hashrate)}</div>

      <div className="mt-2">
        <Sparkline data={chartData} color="#a78bfa" formatValue={formatHashrate} />
      </div>

      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>{latest?.workersOnline ?? "—"} workers</span>
        <span>{formatRelativeTime(latest?.lastShareAt)}</span>
      </div>
    </Card>
  );
}
