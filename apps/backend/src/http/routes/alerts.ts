import type { FastifyInstance } from "fastify";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { alertRules, alertEvents } from "../../db/schema/alerts.js";

export async function registerAlertRoutes(app: FastifyInstance) {
  app.get("/api/alerts/rules", async () => db.select().from(alertRules));

  app.patch<{ Params: { id: string }; Body: { enabled?: boolean; config?: Record<string, unknown> } }>(
    "/api/alerts/rules/:id",
    async (request, reply) => {
      const { enabled, config } = request.body;
      if (enabled === undefined && config === undefined) {
        return reply.code(400).send({ error: "must provide enabled and/or config" });
      }

      const [updated] = await db
        .update(alertRules)
        .set({ ...(enabled !== undefined && { enabled }), ...(config !== undefined && { config }), updatedAt: new Date() })
        .where(eq(alertRules.id, request.params.id))
        .returning();

      if (!updated) return reply.code(404).send({ error: "not found" });
      return updated;
    }
  );

  app.get<{ Querystring: { limit?: string } }>("/api/alerts/events", async (request) => {
    const limit = Math.min(Number(request.query.limit ?? 100), 1000);
    return db.select().from(alertEvents).orderBy(desc(alertEvents.firedAt)).limit(limit);
  });
}
