import cron from "node-cron";
import { pollCkpool } from "./jobs/pollCkpool.js";
import { pollHeroMiners } from "./jobs/pollHeroMiners.js";
import { pollHashvault } from "./jobs/pollHashvault.js";
import { pollKano } from "./jobs/pollKano.js";
import { pollOpenSeaCollections, pollOpenSeaListings } from "./jobs/pollOpenSeaCollections.js";
import { pollWalletPortfolios } from "./jobs/pollWalletPortfolios.js";
import { pruneOldShareEvents } from "../domain/mining/liveHashrate.js";
import { logger } from "../utils/logger.js";
import type { Notifiers } from "./types.js";

/** Central registry of all polling jobs and their cadence. Add new sources here as they're integrated. */
export function startScheduler(notifiers: Notifiers) {
  const miningJobs = [
    () => pollCkpool(notifiers),
    () => pollHeroMiners("PRL", notifiers),
    () => pollHeroMiners("XMR", notifiers),
    () => pollHashvault(notifiers),
    () => pollKano(notifiers),
  ];
  const nftFastJobs = [() => pollOpenSeaCollections(notifiers), () => pollOpenSeaListings(notifiers)];
  const nftSlowJobs = [() => pollWalletPortfolios(notifiers)];

  // Mining sources poll every 5 minutes.
  cron.schedule("*/5 * * * *", () => {
    for (const job of miningJobs) void job();
  });

  // NFT floor prices/listings poll every 2 minutes for near-real-time new-listing alerts.
  cron.schedule("*/2 * * * *", () => {
    for (const job of nftFastJobs) void job();
  });

  // Wallet portfolio holdings change slowly; poll every 15 minutes.
  cron.schedule("*/15 * * * *", () => {
    for (const job of nftSlowJobs) void job();
  });

  // Share event history only feeds windows up to 24h; prune anything older, hourly.
  cron.schedule("0 * * * *", () => void pruneOldShareEvents());

  // Run everything once immediately on boot so the dashboard isn't empty while waiting for the first tick.
  for (const job of [...miningJobs, ...nftFastJobs, ...nftSlowJobs]) void job();

  logger.info("scheduler started");
}
