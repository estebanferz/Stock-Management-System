ALTER TABLE "sale" ALTER COLUMN "datetime" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sale" ALTER COLUMN "debt_amount" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sale" ALTER COLUMN "client_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "sale" ALTER COLUMN "seller_id" SET NOT NULL;