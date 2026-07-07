import { and, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { miningSources } from "../../db/schema/mining.js";
import { fetchHeroMinersStats } from "../../integrations/mining/heroMinersClient.js";
import { normalizeHeroMiners } from "../../domain/mining/normalize.js";
import { recordMiningSnapshot } from "../../domain/mining/recordSnapshot.js";
import { computeLiveHashrate } from "../../domain/mining/liveHashrate.js";
import { logger } from "../../utils/logger.js";
import type { Notifiers } from "../types.js";

const COIN_SUBDOMAIN: Record<string, string> = { PRL: "pearl", XMR: "monero" };

// Windows for the live share-stream-derived hashrate figures, mirroring herominers' own live
// dashboard columns (Hash Rate / 1 Hour / 6 Hour / 24 Hour) as closely as our normalized shape allows.
const CURRENT_WINDOW_SECONDS = 5 * 60;
const SHORT_WINDOW_SECONDS = 15 * 60;
const HOUR_WINDOW_SECONDS = 60 * 60;
const DAY_WINDOW_SECONDS = 24 * 60 * 60;

export async function pollHeroMiners(coin: "PRL" | "XMR", notifiers?: Notifiers) {
  const [source] = await db
    .select()
    .from(miningSources)
    .where(and(eq(miningSources.kind, "herominers"), eq(miningSources.coin, coin)));
  if (!source || !source.enabled) return;

  try {
    const raw = await fetchHeroMinersStats(COIN_SUBDOMAIN[coin], source.identifier);
    const snapshot = normalizeHeroMiners(source.id, raw);

    // Pearl's PoUW scheme uses a Bitcoin/SHA256-style difficulty convention (hashrate = difficulty
    // * 2^32 / time), which is what its REST stats_address endpoint gets wrong compared to its own
    // live dashboard (verified: off by ~9 orders of magnitude). Monero/RandomX uses a *different*
    // convention (hashrate = difficulty / time, no multiplier) — verified its REST-reported figures
    // already match that formula, so only PRL needs the live-stream override; applying the Pearl
    // multiplier to XMR shares would inflate it by the same ~9 orders of magnitude in the wrong direction.
    if (coin === "PRL") {
      const [current, hour, day] = await Promise.all([
        computeLiveHashrate(source.id, CURRENT_WINDOW_SECONDS),
        computeLiveHashrate(source.id, HOUR_WINDOW_SECONDS),
        computeLiveHashrate(source.id, DAY_WINDOW_SECONDS),
      ]);
      const short = await computeLiveHashrate(source.id, SHORT_WINDOW_SECONDS);

      if (current.accountHashrate !== null) snapshot.hashrate1m = current.accountHashrate;
      if (short.accountHashrate !== null) snapshot.hashrate5m = short.accountHashrate;
      if (hour.accountHashrate !== null) snapshot.hashrate1hr = hour.accountHashrate;
      if (day.accountHashrate !== null) snapshot.hashrate1d = day.accountHashrate;

      if (hour.perWorker.length > 0) {
        const liveByName = new Map(hour.perWorker.map((w) => [w.workerName, w.hashrate]));
        snapshot.workerBests = snapshot.workerBests.map((w) => ({
          ...w,
          hashrate: liveByName.get(w.workerName) ?? w.hashrate,
        }));
      }
    }

    await recordMiningSnapshot(source.id, snapshot, raw, notifiers);
    logger.info({ source: `herominers-${coin}`, hashrate1m: snapshot.hashrate1m }, "polled herominers");
  } catch (err) {
    logger.error({ err, source: `herominers-${coin}` }, "herominers poll failed");
  }
}
