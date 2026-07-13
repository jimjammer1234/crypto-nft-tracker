import type { MiningSnapshot } from "@crypto-nft-tracker/shared-types";
import type { CkpoolStatsRaw } from "../../integrations/mining/ckpoolClient.js";
import type { HeroMinersStatsRaw } from "../../integrations/mining/heroMinersClient.js";
import type { HashvaultStatsRaw, HashvaultWorkersRaw } from "../../integrations/mining/hashvaultClient.js";
import type { KanoParsedStats } from "../../integrations/mining/kanoClient.js";
import type { TwoMinersStatsRaw } from "../../integrations/mining/twoMinersClient.js";
import type { ParasiteStatsRaw } from "../../integrations/mining/parasiteClient.js";
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
    bestDifficulty: raw.bestever ?? null,
    workerBests: (raw.worker ?? []).map((w) => ({
      workerName: w.workername,
      bestDifficulty: w.bestever ?? null,
      hashrate: parseHashrateString(w.hashrate1hr),
    })),
    // ckpool's per-user solo endpoint doesn't report a blocks-found counter.
    blocksFound: null,
  };
}

/**
 * HeroMiners' native averaging windows (current/1h/6h/24h) don't line up exactly with our
 * ckpool-shaped 1m/5m/1hr/1d slots. We map the closest equivalents; hashrate_6h has no exact slot
 * so it's dropped in favor of the 24h figure landing in hashrate1d.
 */
export function normalizeHeroMiners(sourceId: string, raw: HeroMinersStatsRaw): MiningSnapshot {
  const s = raw.stats;
  const workers = raw.workers ?? [];

  return {
    sourceId,
    polledAt: new Date().toISOString(),
    hashrate1m: s.hashrate ?? null,
    hashrate5m: s.hashrate_1h ?? null,
    hashrate1hr: s.hashrate_1h ?? null,
    hashrate1d: s.hashrate_24h ?? null,
    workersOnline: workers.length,
    sharesTotal: s.solo_shares_good ?? null,
    // Atomic/smallest-unit balance; per-coin decimal conversion to a display amount happens in the UI layer.
    balance: s.balance ? Number(s.balance) : null,
    lastShareAt: s.lastShare ? new Date(Number(s.lastShare) * 1000).toISOString() : null,
    // HeroMiners has no "best share ever" concept, but the stats_address response's top-level
    // `workers` array does give named per-rig current hashrate.
    bestDifficulty: null,
    workerBests: workers.map((w) => ({ workerName: w.name, bestDifficulty: null, hashrate: w.hashrate })),
    blocksFound: s.blocksFoundSolo ?? null,
  };
}

export function normalizeHashvault(sourceId: string, raw: HashvaultStatsRaw, workers?: HashvaultWorkersRaw): MiningSnapshot {
  const solo = raw.solo;
  const workersOnline = workers ? workers.solo.filter((w) => !w.offline).length : null;

  return {
    sourceId,
    polledAt: new Date().toISOString(),
    hashrate1m: solo.hashRate ?? null,
    hashrate5m: solo.avg3hashRate ?? null,
    hashrate1hr: solo.avg1hashRate ?? null,
    hashrate1d: solo.avg24hashRate ?? null,
    workersOnline,
    sharesTotal: solo.validShares ?? null,
    // Atomic piconero units (1 XMR = 1e12); display conversion happens in the UI layer.
    balance: raw.revenue?.confirmedBalance ?? null,
    // hashvault's lastShare is unix milliseconds, unlike ckpool/herominers which use seconds.
    lastShareAt: solo.lastShare ? new Date(solo.lastShare).toISOString() : null,
    // hashvault has no per-share difficulty stat at all, but its separate /workers endpoint
    // gives named per-rig hashrate.
    bestDifficulty: null,
    workerBests: (workers?.solo ?? []).map((w) => ({ workerName: w.name, bestDifficulty: null, hashrate: w.hashRate })),
    blocksFound: solo.foundBlocks ?? null,
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
    bestDifficulty: parsed.bestDifficulty,
    workerBests: parsed.workerBests,
    // kano.is's HTML worker page has no blocks-found counter for this pool.
    blocksFound: null,
  };
}

/**
 * 2Miners only exposes two hashrate windows (current, and an averaged "hr2") rather than
 * ckpool's four; hashrate5m/hashrate1d are left null rather than guessed.
 */
export function normalizeTwoMiners(sourceId: string, raw: TwoMinersStatsRaw): MiningSnapshot {
  const workers = Object.entries(raw.workers ?? {});

  return {
    sourceId,
    polledAt: new Date().toISOString(),
    hashrate1m: raw.currentHashrate ?? null,
    hashrate5m: null,
    hashrate1hr: raw.hashrate ?? null,
    hashrate1d: null,
    workersOnline: raw.workersOnline ?? null,
    sharesTotal: raw.sharesValid ?? null,
    // Atomic/smallest-unit balance; per-coin decimal conversion to a display amount happens in the UI layer.
    balance: raw.stats?.balance ?? null,
    lastShareAt: raw.stats?.lastShare ? new Date(raw.stats.lastShare * 1000).toISOString() : null,
    // 2Miners has no "best share ever" concept, but does give named per-worker current hashrate.
    bestDifficulty: null,
    workerBests: workers.map(([name, w]) => ({ workerName: name, bestDifficulty: null, hashrate: w.hr ?? null })),
    blocksFound: raw.stats?.blocksFound ?? null,
  };
}

/**
 * parasite.space is a solo BTC pool. Its account-level bestDifficulty is an abbreviated string
 * (e.g. "1.13T"), reused via the same K/M/G/T/P suffix parser as hashrate strings, while
 * per-worker bestDifficulty/hashrate/lastSubmission come through as plain numeric strings.
 * lastShareAt uses the freshest worker lastSubmission rather than the human "1m ago" top-level field.
 */
export function normalizeParasite(sourceId: string, raw: ParasiteStatsRaw): MiningSnapshot {
  const workers = raw.workerData ?? [];
  const latestSubmission = workers.reduce<number | null>((latest, w) => {
    const t = Number(w.lastSubmission);
    if (!Number.isFinite(t) || t === 0) return latest;
    return latest === null ? t : Math.max(latest, t);
  }, null);

  return {
    sourceId,
    polledAt: new Date().toISOString(),
    hashrate1m: raw.hashrate ?? null,
    hashrate5m: null,
    hashrate1hr: null,
    hashrate1d: null,
    workersOnline: raw.workers ?? null,
    // parasite.space's account API doesn't report a share count.
    sharesTotal: null,
    // Solo BTC pools pay out per found block rather than tracking a running balance.
    balance: null,
    lastShareAt: latestSubmission ? new Date(latestSubmission * 1000).toISOString() : null,
    bestDifficulty: parseHashrateString(raw.bestDifficulty),
    workerBests: workers.map((w) => ({
      workerName: w.name,
      bestDifficulty: w.bestDifficulty ? Number(w.bestDifficulty) : null,
      hashrate: w.hashrate ? Number(w.hashrate) : null,
    })),
    // parasite.space's account API doesn't report a blocks-found counter.
    blocksFound: null,
  };
}
