import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { miningSources } from "../db/schema/mining.js";
import { startHeroMinersShareStream } from "../integrations/mining/heroMinersStreamClient.js";
import { recordShareEvent } from "../domain/mining/liveHashrate.js";
import { logger } from "../utils/logger.js";

const COIN_SUBDOMAIN: Record<string, string> = { PRL: "pearl", XMR: "monero" };

/** Starts one persistent share-stream connection per herominers source. These run for the life of
 * the process (independent of the 5-minute REST poll cycle) so live hashrate windows stay populated. */
export async function startLiveShareStreams() {
  const sources = await db.select().from(miningSources).where(eq(miningSources.kind, "herominers"));

  for (const source of sources) {
    if (!source.enabled) continue;
    const subdomain = COIN_SUBDOMAIN[source.coin];
    if (!subdomain) continue;

    startHeroMinersShareStream(subdomain, source.identifier, (event) => {
      void recordShareEvent(source.id, event.workerName, event.difficulty).catch((err) =>
        logger.error({ err, sourceId: source.id }, "failed to record share event")
      );
    });
  }
}
