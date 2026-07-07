ALTER TABLE "mining_snapshots" ADD COLUMN "best_difficulty" numeric;--> statement-breakpoint
ALTER TABLE "mining_snapshots" ADD COLUMN "worker_bests" jsonb;--> statement-breakpoint
ALTER TABLE "mining_snapshots" ADD COLUMN "blocks_found" integer;