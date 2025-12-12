ALTER TABLE "seller" ALTER COLUMN "hire_date" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "seller" ALTER COLUMN "pay_date" SET DEFAULT CURRENT_DATE;--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "is_deleted" boolean DEFAULT false;