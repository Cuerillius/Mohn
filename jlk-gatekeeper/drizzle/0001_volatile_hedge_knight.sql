CREATE TABLE "profile" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watch_history" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"media_id" text NOT NULL,
	"media_type" text NOT NULL,
	"watched_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watch_list" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"media_id" text NOT NULL,
	"media_type" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_history" ADD CONSTRAINT "watch_history_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watch_list" ADD CONSTRAINT "watch_list_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;