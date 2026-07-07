import Fastify from "fastify";
import cors from "@fastify/cors";
import websocketPlugin from "@fastify/websocket";
import { requireAuth } from "./middleware/auth.js";
import { registerMiningRoutes } from "./routes/mining.js";
import { registerNftRoutes } from "./routes/nft.js";
import { registerAlertRoutes } from "./routes/alerts.js";
import { registerWsGateway } from "../ws/gateway.js";

export async function buildServer() {
  const app = Fastify({ logger: false });

  // Single-user personal API gated by a bearer token regardless of origin, so allowing any
  // origin here is fine — this only controls which browsers can *read* the response, and the
  // Electron client's renderer runs from a file:// origin that needs this to be permissive.
  await app.register(cors, { origin: true });

  await app.register(websocketPlugin);

  app.get("/health", async () => ({ ok: true }));

  app.addHook("onRequest", async (request, reply) => {
    if (request.method === "OPTIONS") return; // let @fastify/cors answer preflight requests
    if (request.url.startsWith("/api/")) {
      await requireAuth(request, reply);
    }
  });

  await registerMiningRoutes(app);
  await registerNftRoutes(app);
  await registerAlertRoutes(app);
  await registerWsGateway(app);

  return app;
}
