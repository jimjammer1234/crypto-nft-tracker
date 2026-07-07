import { useState } from "react";
import { PageShell } from "../components/layout/PageShell.js";
import { Card } from "../components/ui/Card.js";
import { useAlertRules, useAlertEvents } from "../hooks/useAlertsData.js";
import { useAlertStore } from "../state/alertStore.js";
import { useMiningSources } from "../hooks/useMiningData.js";
import { useNftCollections, useNftWallets } from "../hooks/useNftData.js";
import { api, type AlertRuleRow } from "../lib/apiClient.js";
import { formatRelativeTime } from "../lib/format.js";

const KIND_LABELS: Record<string, string> = {
  rig_offline: "Rig offline",
  hashrate_drop: "Hashrate drop",
  payout_received: "Payout received",
  new_listing: "New listing",
  floor_threshold: "Floor price threshold",
  portfolio_change: "Portfolio value change",
};

function severityColor(severity: string) {
  if (severity === "critical") return "text-red-400";
  if (severity === "warning") return "text-yellow-400";
  return "text-blue-400";
}

export function Alerts() {
  const { rules, reload } = useAlertRules();
  const events = useAlertEvents();
  const liveAlerts = useAlertStore((s) => s.recentAlerts);
  const { sources } = useMiningSources();
  const collections = useNftCollections();
  const wallets = useNftWallets();

  const targetLabel = (rule: AlertRuleRow) => {
    if (rule.targetType === "mining_source") return sources.find((s) => s.id === rule.targetId)?.label ?? rule.targetId;
    if (rule.targetType === "nft_collection") return collections.find((c) => c.id === rule.targetId)?.name ?? rule.targetId;
    if (rule.targetType === "nft_wallet") {
      const wallet = wallets.find((w) => w.id === rule.targetId);
      return wallet ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : rule.targetId;
    }
    return rule.targetId;
  };

  return (
    <PageShell title="Alerts">
      {liveAlerts.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Live (this session)</h2>
          <Card>
            <div className="divide-y divide-border">
              {liveAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between py-2 text-sm">
                  <span className={severityColor(alert.severity)}>{alert.message}</span>
                  <span className="text-xs text-gray-600">{formatRelativeTime(alert.firedAt)}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">Rules</h2>
        <Card>
          <div className="divide-y divide-border">
            {rules.map((rule) => (
              <RuleRow key={rule.id} rule={rule} label={targetLabel(rule)} onSaved={reload} />
            ))}
            {rules.length === 0 && <div className="py-2 text-sm text-gray-500">No rules yet.</div>}
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">History</h2>
        <Card>
          <div className="divide-y divide-border">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between py-2 text-sm">
                <span className={severityColor(event.severity)}>{event.message}</span>
                <span className="text-xs text-gray-600">{formatRelativeTime(event.firedAt)}</span>
              </div>
            ))}
            {events.length === 0 && <div className="py-2 text-sm text-gray-500">No alerts fired yet.</div>}
          </div>
        </Card>
      </section>
    </PageShell>
  );
}

function primaryConfigField(kind: string): { key: string; label: string } | null {
  switch (kind) {
    case "rig_offline":
      return { key: "staleMinutes", label: "min" };
    case "hashrate_drop":
      return { key: "dropPercent", label: "%" };
    case "portfolio_change":
      return { key: "changePercent", label: "%" };
    case "floor_threshold":
      return { key: "value", label: "ETH" };
    default:
      return null;
  }
}

function RuleRow({ rule, label, onSaved }: { rule: AlertRuleRow; label: string; onSaved: () => void }) {
  const field = primaryConfigField(rule.kind);
  const [value, setValue] = useState(field ? String(rule.config[field.key] ?? "") : "");
  const [saving, setSaving] = useState(false);

  async function toggleEnabled() {
    await api.patchAlertRule(rule.id, { enabled: !rule.enabled });
    onSaved();
  }

  async function saveValue() {
    if (!field) return;
    setSaving(true);
    try {
      await api.patchAlertRule(rule.id, { config: { ...rule.config, [field.key]: Number(value) } });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate text-white">{label}</div>
        <div className="text-xs text-gray-500">{KIND_LABELS[rule.kind] ?? rule.kind}</div>
      </div>

      {field && (
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={saveValue}
            disabled={saving}
            className="w-20 rounded-md border border-border bg-elevated px-2 py-1 text-right text-white"
          />
          <span className="text-xs text-gray-500">{field.label}</span>
        </div>
      )}

      <button
        onClick={toggleEnabled}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          rule.enabled ? "bg-purple-600 text-white" : "bg-elevated text-gray-500"
        }`}
      >
        {rule.enabled ? "Enabled" : "Disabled"}
      </button>
    </div>
  );
}
