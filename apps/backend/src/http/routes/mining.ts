import type { FastifyInstance } from "fastify";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { miningSources, miningSnapshots } from "../../db/schema/mining.js";

export async function registerMiningRoutes(app: FastifyInstance) {
  app.get("/api/mining/sources", async () => {
    const sources = await db.select().from(miningSources);

    // One row per source: its most recent snapshot's best-difficulty, used to sort the dashboard.
    const latestBest = await db
      .selectDistinctOn([miningSnapshots.sourceId], {
        sourceId: miningSnapshots.sourceId,
        bestDifficulty: miningSnapshots.bestDifficulty,
      })
      .from(miningSnapshots)
      .orderBy(miningSnapshots.sourceId, desc(miningSnapshots.polledAt));

    const bestBySource = new Map(latestBest.map((row) => [row.sourceId, row.bestDifficulty]));
    return sources.map((source) => ({
      ...source,
      latestBestDifficulty: bestBySource.get(source.id) ?? null,
    }));
  });

  app.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    "/api/mining/sources/:id/snapshots",
    async (request) => {
      const limit = Math.min(Number(request.query.limit ?? 100), 1000);
      return db
        .select()
        .from(miningSnapshots)
        .where(eq(miningSnapshots.sourceId, request.params.id))
        .orderBy(desc(miningSnapshots.polledAt))
        .limit(limit);
    }
  );
}
