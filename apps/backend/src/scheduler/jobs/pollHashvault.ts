import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { miningSources } from "../../db/schema/mining.js";
import { fetchHashvaultStats, fetchHashvaultWorkers } from "../../integrations/mining/hashvaultClient.js";
import { normalizeHashvault } from "../../domain/mining/normalize.js";
import { recordMiningSnapshot } from "../../domain/mining/recordSnapshot.js";
import { logger } from "../../utils/logger.js";
import type { Notifiers } from "../types.js";

export async function pollHashvault(notifiers?: Notifiers) {
  const [source] = await db.select().from(miningSources).where(eq(miningSources.kind, "hashvault"));
  if (!source || !source.enabled) return;

  try {
    const raw = await fetchHashvaultStats(source.identifier);
    const workers = await fetchHashvaultWorkers(source.identifier).catch(() => undefined);
    const snapshot = normalizeHashvault(source.id, raw, workers);
    await recordMiningSnapshot(source.id, snapshot, { ...raw, workers }, notifiers);
    logger.info({ source: "hashvault", hashrate1m: snapshot.hashrate1m, workersOnline: snapshot.workersOnline }, "polled hashvault");
  } catch (err) {
    logger.error({ err, source: "hashvault" }, "hashvault poll failed");
  }
}
