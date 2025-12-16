ALTER TABLE "expense" DROP CONSTRAINT "expense_receipt_number_unique";--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "receipt_path" varchar(255);--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "receipt_original_name" varchar(255);--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "receipt_mime" varchar(100);--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "receipt_size" integer;--> statement-breakpoint
ALTER TABLE "expense" DROP COLUMN "receipt_number";