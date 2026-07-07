import { and, eq, gt, sql, lt } from "drizzle-orm";
import { db } from "../../db/client.js";
import { miningShareEvents } from "../../db/schema/mining.js";

// Average hash attempts per unit of difficulty for a difficulty-1 share, the standard constant
// used by most pool softwares (including herominers) to convert share difficulty into an implied
// hashrate. Reverse-engineered by matching this constant against herominers' own live dashboard.
const HASHES_PER_DIFFICULTY = 2 ** 32;

export interface LiveWorkerHashrate {
  workerName: string;
  hashrate: number;
}

export async function recordShareEvent(sourceId: string, workerName: string, difficulty: number) {
  await db.insert(miningShareEvents).values({ sourceId, workerName, difficulty: difficulty.toString() });
}

/** Sum of difficulty-weighted shares in the last `windowSeconds`, converted to an implied hashrate,
 * both account-wide and per worker. Returns null for a bucket with no shares in that window yet
 * (e.g. right after a restart) rather than reporting a misleading zero. */
export async function computeLiveHashrate(
  sourceId: string,
  windowSeconds: number
): Promise<{ accountHashrate: number | null; perWorker: LiveWorkerHashrate[] }> {
  const since = new Date(Date.now() - windowSeconds * 1000);

  const rows = await db
    .select({
      workerName: miningShareEvents.workerName,
      totalDifficulty: sql<string>`sum(${miningShareEvents.difficulty})`,
    })
    .from(miningShareEvents)
    .where(and(eq(miningShareEvents.sourceId, sourceId), gt(miningShareEvents.occurredAt, since)))
    .groupBy(miningShareEvents.workerName);

  if (rows.length === 0) {
    return { accountHashrate: null, perWorker: [] };
  }

  const perWorker = rows.map((r) => ({
    workerName: r.workerName,
    hashrate: (Number(r.totalDifficulty) * HASHES_PER_DIFFICULTY) / windowSeconds,
  }));

  const accountHashrate = perWorker.reduce((sum, w) => sum + w.hashrate, 0);

  return { accountHashrate, perWorker };
}

/** Share event history only needs to cover the longest window we compute (24h); prune beyond that
 * so the table doesn't grow unbounded. */
export async function pruneOldShareEvents() {
  const cutoff = new Date(Date.now() - 25 * 60 * 60 * 1000);
  await db.delete(miningShareEvents).where(lt(miningShareEvents.occurredAt, cutoff));
}
