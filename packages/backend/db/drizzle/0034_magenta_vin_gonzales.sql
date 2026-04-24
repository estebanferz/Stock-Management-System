CREATE TABLE "deposit" (
	"deposit_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "deposit_deposit_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"address" varchar(255),
	"is_deleted" boolean DEFAULT false,
	"tenant_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "headphone" (
	"device_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "headphone_device_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"datetime" timestamp DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"brand" varchar(100) NOT NULL,
	"imei" varchar(100),
	"device_type" varchar(100) NOT NULL,
	"color" varchar(50),
	"category" varchar(100) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"buy_cost" numeric(12, 2) NOT NULL,
	"currency_buy" varchar(8) DEFAULT 'USD' NOT NULL,
	"currency_sale" varchar(8) DEFAULT 'USD' NOT NULL,
	"deposit" varchar(255) NOT NULL,
	"sold" boolean DEFAULT false NOT NULL,
	"trade_in" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	"in_repair" boolean DEFAULT false,
	"tenant_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deposit" ADD CONSTRAINT "deposit_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "headphone" ADD CONSTRAINT "headphone_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deposit_tenant_deleted_idx" ON "deposit" USING btree ("tenant_id","is_deleted");--> statement-breakpoint
CREATE INDEX "headphone_tenant_deleted_idx" ON "headphone" USING btree ("tenant_id","is_deleted");--> statement-breakpoint
CREATE INDEX "headphone_tenant_sold_idx" ON "headphone" USING btree ("tenant_id","sold");--> statement-breakpoint
CREATE INDEX "headphone_tenant_datetime_idx" ON "headphone" USING btree ("tenant_id","datetime");--> statement-breakpoint
CREATE UNIQUE INDEX "headphone_tenant_imei_unique" ON "headphone" USING btree ("tenant_id","imei");