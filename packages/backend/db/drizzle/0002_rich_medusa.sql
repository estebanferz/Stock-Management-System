ALTER TABLE "expense" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "phone" ALTER COLUMN "datetime" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "phone" ALTER COLUMN "device_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "phone" ALTER COLUMN "price" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "phone" ALTER COLUMN "buy_cost" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "repair" ALTER COLUMN "client_cost" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "repair" ALTER COLUMN "internal_cost" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "sale" ALTER COLUMN "total_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "sale" ALTER COLUMN "debt_amount" SET DATA TYPE numeric(12, 2);