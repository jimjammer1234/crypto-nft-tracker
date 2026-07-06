import type { FastifyInstance } from "fastify";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { miningSources, miningSnapshots } from "../../db/schema/mining.js";

export async function registerMiningRoutes(app: FastifyInstance) {
  app.get("/api/mining/sources", async () => {
    return db.select().from(miningSources);
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
