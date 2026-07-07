CREATE TABLE IF NOT EXISTS "mining_share_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"source_id" uuid NOT NULL,
	"worker_name" text NOT NULL,
	"difficulty" numeric NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mining_share_events" ADD CONSTRAINT "mining_share_events_source_id_mining_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."mining_sources"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mining_share_events_source_occurred_idx" ON "mining_share_events" USING btree ("source_id","occurred_at");