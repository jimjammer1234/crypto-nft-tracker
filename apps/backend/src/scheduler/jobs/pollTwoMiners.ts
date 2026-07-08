import { and, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { miningSources } from "../../db/schema/mining.js";
import { fetchTwoMinersStats } from "../../integrations/mining/twoMinersClient.js";
import { normalizeTwoMiners } from "../../domain/mining/normalize.js";
import { recordMiningSnapshot } from "../../domain/mining/recordSnapshot.js";
import { logger } from "../../utils/logger.js";
import type { Notifiers } from "../types.js";

const COIN_SUBDOMAIN: Record<string, string> = { ZEC: "solo-zec" };

export async function pollTwoMiners(coin: "ZEC", notifiers?: Notifiers) {
  const [source] = await db
    .select()
    .from(miningSources)
    .where(and(eq(miningSources.kind, "2miners"), eq(miningSources.coin, coin)));
  if (!source || !source.enabled) return;

  try {
    const raw = await fetchTwoMinersStats(COIN_SUBDOMAIN[coin], source.identifier);
    const snapshot = normalizeTwoMiners(source.id, raw);
    await recordMiningSnapshot(source.id, snapshot, raw, notifiers);
    logger.info({ source: `2miners-${coin}`, hashrate1m: snapshot.hashrate1m }, "polled 2miners");
  } catch (err) {
    logger.error({ err, source: `2miners-${coin}` }, "2miners poll failed");
  }
}
