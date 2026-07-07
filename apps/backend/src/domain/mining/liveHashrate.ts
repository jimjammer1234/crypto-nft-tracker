import { and, eq, gt, sql, lt } from "drizzle-orm";
import { db } from "../../db/client.js";
import { miningShareEvents } from "../../db/schema/mining.js";

// Average hash attempts per unit of difficulty for a difficulty-1 share, under the Bitcoin/SHA256-
// style convention. This is specific to coins using that convention (confirmed correct for Pearl's
// PoUW scheme) — NOT universal. Monero/RandomX, for example, uses hashrate = difficulty / time with
// no multiplier at all, so callers must only apply this to sources verified to need it (see
// pollHeroMiners.ts, which currently only overrides PRL's REST-reported hashrate, not XMR's).
const HASHES_PER_DIFFICULTY = 2 ** 32;

// Below this many shares in a window, the estimate is too noisy to trust (a single lucky/unlucky
// share gap can swing the implied rate wildly); fall back to the REST-reported figure instead.
const MIN_SHARES_FOR_ESTIMATE = 3;
// Floor for the elapsed-time divisor so a couple of shares landing seconds apart can't blow up
// the estimate toward infinity.
const MIN_DIVISOR_SECONDS = 60;

export interface LiveWorkerHashrate {
  workerName: string;
  hashrate: number;
}

export async function recordShareEvent(sourceId: string, workerName: string, difficulty: number) {
  await db.insert(miningShareEvents).values({ sourceId, workerName, difficulty: difficulty.toString() });
}

/** Difficulty-weighted hashrate over the last `windowSeconds`, both account-wide and per worker.
 *
 * Crucially, this divides by the *actual* time span covered by the shares found (clamped to
 * windowSeconds), not always by windowSeconds itself — right after a restart there may only be a
 * few minutes of history even for a nominally 24h window, and dividing by the full 86400s would
 * artificially deflate the result by orders of magnitude until a full day had passed.
 *
 * Returns null for a worker/account with too little data to trust yet, so the caller can fall
 * back to the REST-reported figure instead of showing a misleading number. */
export async function computeLiveHashrate(
  sourceId: string,
  windowSeconds: number
): Promise<{ accountHashrate: number | null; perWorker: LiveWorkerHashrate[] }> {
  const since = new Date(Date.now() - windowSeconds * 1000);

  const rows = await db
    .select({
      workerName: miningShareEvents.workerName,
      totalDifficulty: sql<string>`sum(${miningShareEvents.difficulty})`,
      shareCount: sql<number>`count(*)`,
      earliestAt: sql<Date>`min(${miningShareEvents.occurredAt})`,
    })
    .from(miningShareEvents)
    .where(and(eq(miningShareEvents.sourceId, sourceId), gt(miningShareEvents.occurredAt, since)))
    .groupBy(miningShareEvents.workerName);

  const now = Date.now();
  const perWorker: LiveWorkerHashrate[] = [];

  for (const r of rows) {
    if (r.shareCount < MIN_SHARES_FOR_ESTIMATE) continue;

    const elapsedSeconds = (now - new Date(r.earliestAt).getTime()) / 1000;
    const divisor = Math.min(windowSeconds, Math.max(elapsedSeconds, MIN_DIVISOR_SECONDS));
    perWorker.push({
      workerName: r.workerName,
      hashrate: (Number(r.totalDifficulty) * HASHES_PER_DIFFICULTY) / divisor,
    });
  }

  if (perWorker.length === 0) {
    return { accountHashrate: null, perWorker: [] };
  }

  const accountHashrate = perWorker.reduce((sum, w) => sum + w.hashrate, 0);
  return { accountHashrate, perWorker };
}

/** Share event history only needs to cover the longest window we compute (24h); prune beyond that
 * so the table doesn't grow unbounded. */
export async function pruneOldShareEvents() {
  const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000);
  await db.delete(miningShareEvents).where(lt(miningShareEvents.occurredAt, cutoff));
}
