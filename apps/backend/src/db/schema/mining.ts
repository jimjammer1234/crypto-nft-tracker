import { pgTable, uuid, text, boolean, timestamp, jsonb, numeric, integer, bigserial, index } from "drizzle-orm/pg-core";

export const miningSources = pgTable("mining_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(), // 'ckpool' | 'kano' | 'herominers' | 'hashvault'
  label: text("label").notNull(),
  coin: text("coin").notNull(), // 'BTC' | 'PRL' | 'XMR'
  identifier: text("identifier").notNull(),
  endpointMeta: jsonb("endpoint_meta"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const miningSnapshots = pgTable("mining_snapshots", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sourceId: uuid("source_id").notNull().references(() => miningSources.id),
  polledAt: timestamp("polled_at", { withTimezone: true }).notNull().defaultNow(),
  hashrate1m: numeric("hashrate_1m"),
  hashrate5m: numeric("hashrate_5m"),
  hashrate1hr: numeric("hashrate_1hr"),
  hashrate1d: numeric("hashrate_1d"),
  workersOnline: integer("workers_online"),
  sharesTotal: numeric("shares_total"),
  balance: numeric("balance"),
  lastShareAt: timestamp("last_share_at", { withTimezone: true }),
  // Highest-difficulty share ever submitted by this rig (account-level); null where the source API doesn't expose it.
  bestDifficulty: numeric("best_difficulty"),
  // Per-worker breakdown of the same stat, where the source exposes individual workers: [{ workerName, bestDifficulty }].
  workerBests: jsonb("worker_bests"),
  // Cumulative blocks found so far, where the source exposes it; used to detect newly-found blocks.
  blocksFound: integer("blocks_found"),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Raw share events from a pool's live SSE stream (currently herominers only), used to compute a
 * live windowed hashrate that matches the pool's own real-time dashboard, since some pools' REST
 * stats endpoints report a hashrate figure computed completely differently from their live page. */
export const miningShareEvents = pgTable(
  "mining_share_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    sourceId: uuid("source_id").notNull().references(() => miningSources.id),
    workerName: text("worker_name").notNull(),
    difficulty: numeric("difficulty").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sourceOccurredIdx: index("mining_share_events_source_occurred_idx").on(t.sourceId, t.occurredAt),
  })
);

export const miningPayoutEvents = pgTable("mining_payout_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sourceId: uuid("source_id").notNull().references(() => miningSources.id),
  amount: numeric("amount").notNull(),
  coin: text("coin").notNull(),
  txReference: text("tx_reference"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
