import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { miningSources } from "../../db/schema/mining.js";
import { fetchParasiteStats } from "../../integrations/mining/parasiteClient.js";
import { normalizeParasite } from "../../domain/mining/normalize.js";
import { recordMiningSnapshot } from "../../domain/mining/recordSnapshot.js";
import { logger } from "../../utils/logger.js";
import type { Notifiers } from "../types.js";

export async function pollParasite(notifiers?: Notifiers) {
  const [source] = await db.select().from(miningSources).where(eq(miningSources.kind, "parasite"));
  if (!source || !source.enabled) return;

  try {
    const raw = await fetchParasiteStats(source.identifier);
    const snapshot = normalizeParasite(source.id, raw);
    await recordMiningSnapshot(source.id, snapshot, raw, notifiers);
    logger.info({ source: "parasite", hashrate1m: snapshot.hashrate1m }, "polled parasite.space");
  } catch (err) {
    logger.error({ err, source: "parasite" }, "parasite.space poll failed");
  }
}
