CREATE TABLE IF NOT EXISTS "alert_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"rule_id" uuid NOT NULL,
	"fired_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"payload" jsonb,
	"acknowledged" boolean DEFAULT false NOT NULL,
	"delivered_ws" boolean DEFAULT false NOT NULL,
	"delivered_native" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"config" jsonb NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mining_payout_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"coin" text NOT NULL,
	"tx_reference" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mining_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source_id" uuid NOT NULL,
	"polled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"hashrate_1m" numeric,
	"hashrate_5m" numeric,
	"hashrate_1hr" numeric,
	"hashrate_1d" numeric,
	"workers_online" integer,
	"shares_total" numeric,
	"balance" numeric,
	"last_share_at" timestamp with time zone,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mining_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"coin" text NOT NULL,
	"identifier" text NOT NULL,
	"endpoint_meta" jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nft_collection_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"collection_id" uuid NOT NULL,
	"marketplace" text NOT NULL,
	"polled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"floor_price" numeric,
	"floor_currency" text DEFAULT 'ETH' NOT NULL,
	"volume_24h" numeric,
	"num_listed" integer,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nft_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"contract_address" text,
	"name" text NOT NULL,
	"chain" text DEFAULT 'ethereum' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nft_collections_slug_chain_unique" UNIQUE("slug","chain")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nft_listing_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"collection_id" uuid NOT NULL,
	"marketplace" text NOT NULL,
	"token_id" text NOT NULL,
	"price" numeric,
	"currency" text DEFAULT 'ETH',
	"seller" text,
	"listed_at" timestamp with time zone NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nft_listing_events_collection_id_marketplace_token_id_listed_at_unique" UNIQUE("collection_id","marketplace","token_id","listed_at")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nft_wallet_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"wallet_id" uuid NOT NULL,
	"polled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"total_value_eth" numeric,
	"nft_count" integer,
	"holdings" jsonb,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nft_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"label" text,
	"chain" text DEFAULT 'ethereum' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "nft_wallets_address_unique" UNIQUE("address")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_rule_id_alert_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mining_payout_events" ADD CONSTRAINT "mining_payout_events_source_id_mining_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."mining_sources"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mining_snapshots" ADD CONSTRAINT "mining_snapshots_source_id_mining_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."mining_sources"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nft_collection_snapshots" ADD CONSTRAINT "nft_collection_snapshots_collection_id_nft_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."nft_collections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nft_listing_events" ADD CONSTRAINT "nft_listing_events_collection_id_nft_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."nft_collections"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nft_wallet_snapshots" ADD CONSTRAINT "nft_wallet_snapshots_wallet_id_nft_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."nft_wallets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
