ALTER TABLE "watch_history" ADD COLUMN "position" integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE "watch_history" ADD COLUMN "duration" integer NOT NULL DEFAULT 0;
