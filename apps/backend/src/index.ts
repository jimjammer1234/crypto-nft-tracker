import "./config/loadEnv.js";
import { buildServer } from "./http/server.js";
import { startScheduler } from "./scheduler/index.js";
import { startLiveShareStreams } from "./scheduler/liveStreams.js";
import { broadcast } from "./ws/gateway.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const app = await buildServer();

startScheduler({
  onMiningSnapshot: (snapshot) => broadcast({ type: "mining.snapshot", data: snapshot }),
  onNftCollectionSnapshot: (snapshot) => broadcast({ type: "nft.collection_snapshot", data: snapshot }),
  onNftListing: (listing) => broadcast({ type: "nft.listing", data: listing }),
  onAlert: (alert) => broadcast({ type: "alert.fired", data: alert }),
});

await startLiveShareStreams();

await app.listen({ port: env.PORT, host: "0.0.0.0" });
logger.info({ port: env.PORT }, "backend listening");
