import { pgTable, uuid, text, boolean, timestamp, jsonb, numeric, integer, bigserial, unique } from "drizzle-orm/pg-core";

export const nftWallets = pgTable("nft_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  address: text("address").notNull().unique(),
  label: text("label"),
  chain: text("chain").notNull().default("ethereum"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const nftCollections = pgTable("nft_collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull(),
  contractAddress: text("contract_address"),
  name: text("name").notNull(),
  chain: text("chain").notNull().default("ethereum"),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugChainUnique: unique().on(t.slug, t.chain),
}));

export const nftCollectionSnapshots = pgTable("nft_collection_snapshots", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  collectionId: uuid("collection_id").notNull().references(() => nftCollections.id),
  marketplace: text("marketplace").notNull(), // 'opensea' | 'blur'
  polledAt: timestamp("polled_at", { withTimezone: true }).notNull().defaultNow(),
  floorPrice: numeric("floor_price"),
  floorCurrency: text("floor_currency").notNull().default("ETH"),
  volume24h: numeric("volume_24h"),
  numListed: integer("num_listed"),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const nftListingEvents = pgTable("nft_listing_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  collectionId: uuid("collection_id").notNull().references(() => nftCollections.id),
  marketplace: text("marketplace").notNull(),
  tokenId: text("token_id").notNull(),
  price: numeric("price"),
  currency: text("currency").default("ETH"),
  seller: text("seller"),
  listedAt: timestamp("listed_at", { withTimezone: true }).notNull(),
  // True when this token relisted <=20 min after its own previous listing — a common bot/wash-listing
  // pattern (bumping search rank or farming rewards). Still recorded so gap-detection stays accurate
  // across repeated fast relists, but excluded from alerts and from what's surfaced in the UI.
  likelyBot: boolean("likely_bot").notNull().default(false),
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  dedupeUnique: unique().on(t.collectionId, t.marketplace, t.tokenId, t.listedAt),
}));

export const nftWalletSnapshots = pgTable("nft_wallet_snapshots", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  walletId: uuid("wallet_id").notNull().references(() => nftWallets.id),
  polledAt: timestamp("polled_at", { withTimezone: true }).notNull().defaultNow(),
  totalValueEth: numeric("total_value_eth"),
  nftCount: integer("nft_count"),
  holdings: jsonb("holdings"),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
