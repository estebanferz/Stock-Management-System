ALTER TABLE "sale" ALTER COLUMN "currency" SET DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "phone" ADD COLUMN "currency" varchar(8) DEFAULT 'USD' NOT NULL;