import type { MiningSourceRow } from "../../lib/apiClient.js";
import { useMiningSnapshots } from "../../hooks/useMiningData.js";
import { formatHashrate, formatRelativeTime, formatDifficulty } from "../../lib/format.js";
import { miningSourceUrl } from "../../lib/miningLinks.js";
import { openExternal } from "../../lib/openExternal.js";
import { useAlertStore } from "../../state/alertStore.js";
import { Sparkline } from "../ui/Sparkline.js";
import { Card } from "../ui/Card.js";

export function MiningWidget({ source }: { source: MiningSourceRow }) {
  const snapshots = useMiningSnapshots(source.id, 40);
  const latest = snapshots[0];
  const hashrate = latest?.hashrate1hr ?? latest?.hashrate1m ?? null;
  const isStale = latest?.lastShareAt ? Date.now() - new Date(latest.lastShareAt).getTime() > 30 * 60_000 : false;

  const dismissAlert = useAlertStore((s) => s.dismissAlert);
  const blockFoundAlert = useAlertStore((s) =>
    s.recentAlerts.find(
      (a) => a.payload?.kind === "block_found" && a.payload?.sourceId === source.id && !s.dismissedIds.has(a.id)
    )
  );

  const chartData = [...snapshots]
    .reverse()
    .map((s) => ({ x: s.polledAt, y: Number(s.hashrate1hr ?? s.hashrate1m ?? 0) }));

  const workerBests = [...(latest?.workerBests ?? [])].sort(
    (a, b) => (b.bestDifficulty ?? -1) - (a.bestDifficulty ?? -1)
  );

  return (
    <Card
      onClick={() => {
        if (blockFoundAlert) dismissAlert(blockFoundAlert.id);
        openExternal(miningSourceUrl(source));
      }}
      className={`relative cursor-pointer overflow-hidden transition-colors hover:border-purple-500 ${
        blockFoundAlert ? "animate-block-found border-green-500 bg-green-500/10" : ""
      }`}
    >
      {blockFoundAlert && (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute inset-0 h-full w-full scale-150 text-green-500/10"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}

      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-sm font-medium text-white">{source.label}</div>
          <div className="text-xs text-gray-500">{source.coin}</div>
        </div>
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${isStale ? "bg-yellow-500" : "bg-green-500"}`}
          title={isStale ? "stale" : "active"}
        />
      </div>

      <div className="relative mt-3 text-2xl font-semibold text-purple-400">{formatHashrate(hashrate)}</div>

      <div className="relative mt-2">
        <Sparkline data={chartData} color="#a78bfa" formatValue={formatHashrate} />
      </div>

      <div className="relative mt-2 flex justify-between text-xs text-gray-500">
        <span>{latest?.workersOnline ?? "—"} workers</span>
        <span>{formatRelativeTime(latest?.lastShareAt)}</span>
      </div>

      {latest?.bestDifficulty && (
        <div className="relative mt-2 flex justify-between border-t border-border pt-2 text-xs">
          <span className="text-gray-500">Best difficulty</span>
          <span className="text-yellow-400">{formatDifficulty(latest.bestDifficulty)}</span>
        </div>
      )}

      {workerBests.length > 0 && (
        <div className="relative mt-2 space-y-1 border-t border-border pt-2">
          {workerBests.map((worker) => (
            <div key={worker.workerName} className="flex justify-between text-xs text-gray-500">
              <span className="truncate">{worker.workerName.split(".").slice(1).join(".") || worker.workerName}</span>
              <span>
                {formatHashrate(worker.hashrate)}
                {worker.bestDifficulty !== null && (
                  <span className="text-gray-600"> · best {formatDifficulty(worker.bestDifficulty)}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
