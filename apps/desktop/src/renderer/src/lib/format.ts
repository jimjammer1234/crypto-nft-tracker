const HASHRATE_UNITS = ["H/s", "KH/s", "MH/s", "GH/s", "TH/s", "PH/s", "EH/s"];

export function formatHashrate(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (Number.isNaN(num) || num === 0) return "0 H/s";

  let scaled = num;
  let unitIndex = 0;
  while (scaled >= 1000 && unitIndex < HASHRATE_UNITS.length - 1) {
    scaled /= 1000;
    unitIndex++;
  }
  return `${scaled.toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2)} ${HASHRATE_UNITS[unitIndex]}`;
}

export function formatEth(value: string | number | null | undefined, currency = "ETH"): string {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `${num.toFixed(num >= 100 ? 1 : 3)} ${currency}`;
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "never";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.round(diffHr / 24)}d ago`;
}
