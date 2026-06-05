CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"torbox_key" text NOT NULL DEFAULT '',
	"addon_urls" text NOT NULL DEFAULT '[]',
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
