import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocketPlugin from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import { requireAuth } from "./middleware/auth.js";
import { registerMiningRoutes } from "./routes/mining.js";
import { registerNftRoutes } from "./routes/nft.js";
import { registerAlertRoutes } from "./routes/alerts.js";
import { registerWsGateway } from "../ws/gateway.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// apps/backend/src/http -> apps/backend/public (same relative depth whether running from src/ via
// tsx in dev, or from the mirrored dist/ structure in production).
const webBuildDir = path.resolve(here, "../../public");

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

  // Serves the standalone (non-Electron) web build of the same dashboard, so it's reachable from
  // a phone or any browser. Not present in local dev unless `pnpm build:web` has been run.
  if (fs.existsSync(webBuildDir)) {
    await app.register(fastifyStatic, { root: webBuildDir });
  }

  return app;
}
