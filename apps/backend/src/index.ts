import "./config/loadEnv.js";
import { buildServer } from "./http/server.js";
import { startScheduler } from "./scheduler/index.js";
import { broadcast } from "./ws/gateway.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const app = await buildServer();

startScheduler({
  onSnapshot: (snapshot) => broadcast({ type: "mining.snapshot", data: snapshot }),
  onAlert: (alert) => broadcast({ type: "alert.fired", data: alert }),
});

await app.listen({ port: env.PORT, host: "0.0.0.0" });
logger.info({ port: env.PORT }, "backend listening");
