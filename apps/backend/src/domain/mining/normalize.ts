import type { MiningSnapshot } from "@crypto-nft-tracker/shared-types";
import type { CkpoolStatsRaw } from "../../integrations/mining/ckpoolClient.js";
import type { HeroMinersStatsRaw } from "../../integrations/mining/heroMinersClient.js";
import type { HashvaultStatsRaw } from "../../integrations/mining/hashvaultClient.js";
import type { KanoParsedStats } from "../../integrations/mining/kanoClient.js";
import { parseHashrateString } from "../../utils/hashrate.js";

export function normalizeCkpool(sourceId: string, raw: CkpoolStatsRaw): MiningSnapshot {
  return {
    sourceId,
    polledAt: new Date().toISOString(),
    hashrate1m: parseHashrateString(raw.hashrate1m),
    hashrate5m: parseHashrateString(raw.hashrate5m),
    hashrate1hr: parseHashrateString(raw.hashrate1hr),
    hashrate1d: parseHashrateString(raw.hashrate1d),
    workersOnline: raw.workers ?? null,
    sharesTotal: raw.shares ?? null,
    // ckpool solo pays out per found block rather than tracking a running balance; no balance field exists.
    balance: null,
    lastShareAt: raw.lastshare ? new Date(raw.lastshare * 1000).toISOString() : null,
  };
}

/**
 * HeroMiners' native averaging windows (current/1h/6h/24h) don't line up exactly with our
 * ckpool-shaped 1m/5m/1hr/1d slots. We map the closest equivalents; hashrate_6h has no exact slot
 * so it's dropped in favor of the 24h figure landing in hashrate1d.
 */
export function normalizeHeroMiners(sourceId: string, raw: HeroMinersStatsRaw): MiningSnapshot {
  const s = raw.stats;
  return {
    sourceId,
    polledAt: new Date().toISOString(),
    hashrate1m: s.hashrate ?? null,
    hashrate5m: s.hashrate_1h ?? null,
    hashrate1hr: s.hashrate_1h ?? null,
    hashrate1d: s.hashrate_24h ?? null,
    workersOnline: null,
    sharesTotal: s.solo_shares_good ?? null,
    // Atomic/smallest-unit balance; per-coin decimal conversion to a display amount happens in the UI layer.
    balance: s.balance ? Number(s.balance) : null,
    lastShareAt: s.lastShare ? new Date(Number(s.lastShare) * 1000).toISOString() : null,
  };
}

export function normalizeHashvault(sourceId: string, raw: HashvaultStatsRaw): MiningSnapshot {
  const solo = raw.solo;
  return {
    sourceId,
    polledAt: new Date().toISOString(),
    hashrate1m: solo.hashRate ?? null,
    hashrate5m: solo.avg3hashRate ?? null,
    hashrate1hr: solo.avg1hashRate ?? null,
    hashrate1d: solo.avg24hashRate ?? null,
    workersOnline: null,
    sharesTotal: solo.validShares ?? null,
    // Atomic piconero units (1 XMR = 1e12); display conversion happens in the UI layer.
    balance: raw.revenue?.confirmedBalance ?? null,
    // hashvault's lastShare is unix milliseconds, unlike ckpool/herominers which use seconds.
    lastShareAt: solo.lastShare ? new Date(solo.lastShare).toISOString() : null,
  };
}

export function normalizeKano(sourceId: string, parsed: KanoParsedStats, polledAt = new Date()): MiningSnapshot {
  return {
    sourceId,
    polledAt: polledAt.toISOString(),
    hashrate1m: parsed.totalHashrate,
    hashrate5m: null,
    hashrate1hr: null,
    hashrate1d: null,
    workersOnline: parsed.activeWorkers,
    sharesTotal: parsed.totalShares,
    // kano.is's HTML worker page has no balance/payout figures for this pool.
    balance: null,
    lastShareAt:
      parsed.secondsSinceLastShare !== null
        ? new Date(polledAt.getTime() - parsed.secondsSinceLastShare * 1000).toISOString()
        : null,
  };
}
