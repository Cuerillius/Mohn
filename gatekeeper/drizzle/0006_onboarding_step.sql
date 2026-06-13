ALTER TABLE "user_settings" ADD COLUMN "onboarding_step" integer NOT NULL DEFAULT 1;
ALTER TABLE "user_settings" DROP COLUMN "onboarding_done";
