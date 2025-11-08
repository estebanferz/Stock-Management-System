ALTER TABLE "expense" ALTER COLUMN "datetime" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "repair" ALTER COLUMN "datetime" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "seller" ALTER COLUMN "hire_date" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "seller" ALTER COLUMN "hire_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seller" ADD COLUMN "age" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "seller" ADD COLUMN "pay_date" date;