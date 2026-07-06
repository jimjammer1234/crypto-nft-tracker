import cron from "node-cron";
import { pollCkpool } from "./jobs/pollCkpool.js";
import { pollHeroMiners } from "./jobs/pollHeroMiners.js";
import { pollHashvault } from "./jobs/pollHashvault.js";
import { pollKano } from "./jobs/pollKano.js";
import { logger } from "../utils/logger.js";
import type { Notifiers } from "./types.js";

/** Central registry of all polling jobs and their cadence. Add new sources here as they're integrated. */
export function startScheduler(notifiers: Notifiers) {
  const jobs = [
    () => pollCkpool(notifiers),
    () => pollHeroMiners("PRL", notifiers),
    () => pollHeroMiners("XMR", notifiers),
    () => pollHashvault(notifiers),
    () => pollKano(notifiers),
  ];

  // Mining sources poll every 5 minutes.
  cron.schedule("*/5 * * * *", () => {
    for (const job of jobs) void job();
  });

  // Run once immediately on boot so the dashboard isn't empty while waiting for the first tick.
  for (const job of jobs) void job();

  logger.info("scheduler started");
}
