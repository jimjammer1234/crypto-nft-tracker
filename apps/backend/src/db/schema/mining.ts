import { pgTable, uuid, text, boolean, timestamp, jsonb, numeric, integer, bigserial } from "drizzle-orm/pg-core";

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
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

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
