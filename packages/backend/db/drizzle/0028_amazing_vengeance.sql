ALTER TABLE "phone" RENAME COLUMN "currency" TO "currency_buy";--> statement-breakpoint
ALTER TABLE "accessory" ADD COLUMN "currency_buy" varchar(8) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "accessory" ADD COLUMN "currency_sale" varchar(8) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "phone" ADD COLUMN "currency_sale" varchar(8) DEFAULT 'USD' NOT NULL;