import { and, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { miningSources } from "../../db/schema/mining.js";
import { fetchHeroMinersStats } from "../../integrations/mining/heroMinersClient.js";
import { normalizeHeroMiners } from "../../domain/mining/normalize.js";
import { recordMiningSnapshot } from "../../domain/mining/recordSnapshot.js";
import { logger } from "../../utils/logger.js";
import type { Notifiers } from "../types.js";

const COIN_SUBDOMAIN: Record<string, string> = { PRL: "pearl", XMR: "monero" };

export async function pollHeroMiners(coin: "PRL" | "XMR", notifiers?: Notifiers) {
  const [source] = await db
    .select()
    .from(miningSources)
    .where(and(eq(miningSources.kind, "herominers"), eq(miningSources.coin, coin)));
  if (!source || !source.enabled) return;

  try {
    const raw = await fetchHeroMinersStats(COIN_SUBDOMAIN[coin], source.identifier);
    const snapshot = normalizeHeroMiners(source.id, raw);
    await recordMiningSnapshot(source.id, snapshot, raw, notifiers);
    logger.info({ source: `herominers-${coin}`, hashrate1m: snapshot.hashrate1m }, "polled herominers");
  } catch (err) {
    logger.error({ err, source: `herominers-${coin}` }, "herominers poll failed");
  }
}
