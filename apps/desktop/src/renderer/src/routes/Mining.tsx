import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PageShell } from "../components/layout/PageShell.js";
import { Card } from "../components/ui/Card.js";
import { useMiningSources, useMiningSnapshots } from "../hooks/useMiningData.js";
import { formatHashrate, formatRelativeTime } from "../lib/format.js";

export function Mining() {
  const { sources } = useMiningSources();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? sources[0]?.id ?? null;
  const snapshots = useMiningSnapshots(activeId, 60);

  const chartData = [...snapshots]
    .reverse()
    .map((s) => ({
      time: new Date(s.polledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      hashrate: Number(s.hashrate1hr ?? s.hashrate1m ?? 0),
    }));

  const latest = snapshots[0];
  const activeSource = sources.find((s) => s.id === activeId);

  return (
    <PageShell title="Mining">
      <div className="mb-4 flex flex-wrap gap-2">
        {sources.map((source) => (
          <button
            key={source.id}
            onClick={() => setSelectedId(source.id)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              source.id === activeId ? "bg-purple-600 text-white" : "bg-elevated text-gray-400 hover:text-white"
            }`}
          >
            {source.label}
          </button>
        ))}
      </div>

      {activeSource && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Card>
              <div className="text-xs uppercase text-gray-400">Hashrate (1hr)</div>
              <div className="mt-1 text-xl font-semibold text-purple-400">{formatHashrate(latest?.hashrate1hr ?? latest?.hashrate1m)}</div>
            </Card>
            <Card>
              <div className="text-xs uppercase text-gray-400">Workers</div>
              <div className="mt-1 text-xl font-semibold text-blue-400">{latest?.workersOnline ?? "—"}</div>
            </Card>
            <Card>
              <div className="text-xs uppercase text-gray-400">Last Share</div>
              <div className="mt-1 text-xl font-semibold text-white">{formatRelativeTime(latest?.lastShareAt)}</div>
            </Card>
            <Card>
              <div className="text-xs uppercase text-gray-400">Balance</div>
              <div className="mt-1 text-xl font-semibold text-yellow-400">{latest?.balance ?? "—"}</div>
            </Card>
          </div>

          <Card className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid stroke="#2a2438" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(v) => formatHashrate(v)} width={80} />
                <Tooltip
                  contentStyle={{ background: "#1f1b2e", border: "1px solid #2a2438", borderRadius: 8 }}
                  formatter={(value: number) => formatHashrate(value)}
                />
                <Line type="monotone" dataKey="hashrate" stroke="#a78bfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </PageShell>
  );
}
