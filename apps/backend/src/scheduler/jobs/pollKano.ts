import { eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { miningSources } from "../../db/schema/mining.js";
import { fetchKanoWorkersHtml, parseKanoWorkersHtml } from "../../integrations/mining/kanoClient.js";
import { normalizeKano } from "../../domain/mining/normalize.js";
import { recordMiningSnapshot } from "../../domain/mining/recordSnapshot.js";
import { logger } from "../../utils/logger.js";
import type { Notifiers } from "../types.js";

export async function pollKano(notifiers?: Notifiers) {
  const [source] = await db.select().from(miningSources).where(eq(miningSources.kind, "kano"));
  if (!source || !source.enabled) return;

  try {
    const meta = source.endpointMeta as { apiKey?: string } | null;
    if (!meta?.apiKey) {
      logger.error({ source: "kano" }, "kano source missing apiKey in endpoint_meta");
      return;
    }

    const html = await fetchKanoWorkersHtml(source.identifier, meta.apiKey);
    const parsed = parseKanoWorkersHtml(html);
    const polledAt = new Date();
    const snapshot = normalizeKano(source.id, parsed, polledAt);

    // Raw HTML, not JSON, stored so parsing can be redone if kano.is changes markup.
    await recordMiningSnapshot(source.id, snapshot, { html }, notifiers);
    logger.info({ source: "kano", workersOnline: snapshot.workersOnline }, "polled kano");
  } catch (err) {
    logger.error({ err, source: "kano" }, "kano poll failed");
  }
}
