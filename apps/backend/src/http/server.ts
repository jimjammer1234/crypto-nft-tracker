import Fastify from "fastify";
import websocketPlugin from "@fastify/websocket";
import { requireAuth } from "./middleware/auth.js";
import { registerMiningRoutes } from "./routes/mining.js";
import { registerNftRoutes } from "./routes/nft.js";
import { registerWsGateway } from "../ws/gateway.js";

export async function buildServer() {
  const app = Fastify({ logger: false });

  await app.register(websocketPlugin);

  app.get("/health", async () => ({ ok: true }));

  app.addHook("onRequest", async (request, reply) => {
    if (request.url.startsWith("/api/")) {
      await requireAuth(request, reply);
    }
  });

  await registerMiningRoutes(app);
  await registerNftRoutes(app);
  await registerWsGateway(app);

  return app;
}
