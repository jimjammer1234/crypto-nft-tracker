import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { miningSources } from "../../db/schema/mining.js";
import { fetchCkpoolStats } from "../../integrations/mining/ckpoolClient.js";
import { normalizeCkpool } from "../../domain/mining/normalize.js";
import { recordMiningSnapshot } from "../../domain/mining/recordSnapshot.js";
import { logger } from "../../utils/logger.js";
import type { Notifiers } from "../types.js";

export async function pollCkpool(notifiers?: Notifiers) {
  const [source] = await db.select().from(miningSources).where(eq(miningSources.kind, "ckpool"));
  if (!source || !source.enabled) return;

  try {
    const raw = await fetchCkpoolStats(source.identifier);
    const snapshot = normalizeCkpool(source.id, raw);
    await recordMiningSnapshot(source.id, snapshot, raw, notifiers);
    logger.info({ source: "ckpool", hashrate1hr: snapshot.hashrate1hr }, "polled ckpool");
  } catch (err) {
    logger.error({ err, source: "ckpool" }, "ckpool poll failed");
  }
}
