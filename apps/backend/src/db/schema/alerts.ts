import { pgTable, uuid, text, boolean, timestamp, jsonb, bigserial } from "drizzle-orm/pg-core";

export const alertRules = pgTable("alert_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: text("kind").notNull(),
  targetType: text("target_type").notNull(), // 'mining_source' | 'nft_collection' | 'nft_wallet'
  targetId: uuid("target_id").notNull(),
  config: jsonb("config").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const alertEvents = pgTable("alert_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  ruleId: uuid("rule_id").notNull().references(() => alertRules.id),
  firedAt: timestamp("fired_at", { withTimezone: true }).notNull().defaultNow(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"),
  payload: jsonb("payload"),
  acknowledged: boolean("acknowledged").notNull().default(false),
  deliveredWs: boolean("delivered_ws").notNull().default(false),
  deliveredNative: boolean("delivered_native").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
