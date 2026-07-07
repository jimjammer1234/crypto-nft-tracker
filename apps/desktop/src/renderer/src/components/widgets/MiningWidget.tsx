import type { MiningSourceRow } from "../../lib/apiClient.js";
import { useMiningSnapshots } from "../../hooks/useMiningData.js";
import { formatHashrate, formatRelativeTime, formatDifficulty } from "../../lib/format.js";
import { miningSourceUrl } from "../../lib/miningLinks.js";
import { openExternal } from "../../lib/openExternal.js";
import { useAlertStore } from "../../state/alertStore.js";
import { Sparkline } from "../ui/Sparkline.js";
import { Card } from "../ui/Card.js";

const BLOCK_FOUND_HIGHLIGHT_MS = 5 * 60_000;

export function MiningWidget({ source }: { source: MiningSourceRow }) {
  const snapshots = useMiningSnapshots(source.id, 40);
  const latest = snapshots[0];
  const hashrate = latest?.hashrate1hr ?? latest?.hashrate1m ?? null;
  const isStale = latest?.lastShareAt ? Date.now() - new Date(latest.lastShareAt).getTime() > 30 * 60_000 : false;

  const justFoundBlock = useAlertStore((s) =>
    s.recentAlerts.some(
      (a) =>
        a.payload?.kind === "block_found" &&
        a.payload?.sourceId === source.id &&
        Date.now() - new Date(a.firedAt).getTime() < BLOCK_FOUND_HIGHLIGHT_MS
    )
  );

  const chartData = [...snapshots]
    .reverse()
    .map((s) => ({ x: s.polledAt, y: Number(s.hashrate1hr ?? s.hashrate1m ?? 0) }));

  const workerBests = latest?.workerBests ?? [];

  return (
    <Card
      onClick={() => openExternal(miningSourceUrl(source))}
      className={`cursor-pointer transition-colors hover:border-purple-500 ${justFoundBlock ? "animate-block-found border-green-500" : ""}`}
    >
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

      {latest?.bestDifficulty && (
        <div className="mt-2 flex justify-between border-t border-border pt-2 text-xs">
          <span className="text-gray-500">Best difficulty</span>
          <span className="text-yellow-400">{formatDifficulty(latest.bestDifficulty)}</span>
        </div>
      )}

      {workerBests.length > 0 && (
        <div className="mt-2 space-y-1">
          {workerBests.map((worker) => (
            <div key={worker.workerName} className="flex justify-between text-xs text-gray-500">
              <span className="truncate">{worker.workerName.split(".").slice(1).join(".") || worker.workerName}</span>
              <span>{formatDifficulty(worker.bestDifficulty)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
