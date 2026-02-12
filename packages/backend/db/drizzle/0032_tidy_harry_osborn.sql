ALTER TABLE "expense" RENAME COLUMN "receipt_path" TO "receipt_key";--> statement-breakpoint
ALTER TABLE "tenant_settings" RENAME COLUMN "logo_url" TO "logo_key";--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "receipt_uploaded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "logo_mime" varchar(100);--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "logo_updated_at" timestamp with time zone;