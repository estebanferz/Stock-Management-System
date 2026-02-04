ALTER TYPE "public"."subscription_status" ADD VALUE 'trial' BEFORE 'past_due';--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "trial_ends_at" timestamp with time zone;