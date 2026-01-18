CREATE TABLE "sale_gift_accessory" (
	"sale_gift_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sale_gift_accessory_sale_gift_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sale_id" integer NOT NULL,
	"accessory_id" integer NOT NULL,
	"qty" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"unit_buy_cost" numeric(12, 2) NOT NULL,
	"tenant_id" integer NOT NULL,
	"is_deleted" boolean DEFAULT false,
	CONSTRAINT "sale_gift_unique" UNIQUE("sale_id","accessory_id")
);
--> statement-breakpoint
ALTER TABLE "sale_gift_accessory" ADD CONSTRAINT "sale_gift_accessory_sale_id_sale_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sale"("sale_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_gift_accessory" ADD CONSTRAINT "sale_gift_accessory_accessory_id_accessory_accessory_id_fk" FOREIGN KEY ("accessory_id") REFERENCES "public"."accessory"("accessory_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_gift_accessory" ADD CONSTRAINT "sale_gift_accessory_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sale_gift_sale_idx" ON "sale_gift_accessory" USING btree ("tenant_id","sale_id");--> statement-breakpoint
CREATE INDEX "sale_gift_accessory_idx" ON "sale_gift_accessory" USING btree ("tenant_id","accessory_id");