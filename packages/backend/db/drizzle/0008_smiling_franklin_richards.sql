ALTER TABLE "sale" ADD COLUMN "trade_in_device" integer;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_trade_in_device_phone_device_id_fk" FOREIGN KEY ("trade_in_device") REFERENCES "public"."phone"("device_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone" DROP COLUMN "trade_in_device";