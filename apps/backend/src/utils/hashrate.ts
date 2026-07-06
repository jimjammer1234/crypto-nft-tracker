const SUFFIX_MULTIPLIERS: Record<string, number> = {
  "": 1,
  K: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
  E: 1e18,
};

/** Parses pool-style hashrate strings like "223T", "1.44P", "6.63T" into H/s. Returns null if unparseable. */
export function parseHashrateString(value: string | undefined | null): number | null {
  if (!value) return null;
  const match = /^([\d.]+)\s*([KMGTPE]?)Hs?$|^([\d.]+)\s*([KMGTPE]?)$/i.exec(value.trim());
  if (!match) return null;
  const numberPart = match[1] ?? match[3];
  const suffixPart = (match[2] ?? match[4] ?? "").toUpperCase();
  const num = parseFloat(numberPart);
  if (Number.isNaN(num)) return null;
  const multiplier = SUFFIX_MULTIPLIERS[suffixPart];
  if (multiplier === undefined) return null;
  return num * multiplier;
}
