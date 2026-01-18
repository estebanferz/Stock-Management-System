CREATE TABLE "accesory" (
	"accesory_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "accesory_accesory_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"datetime" timestamp DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"brand" varchar(100) NOT NULL,
	"color" varchar(50),
	"category" varchar(100) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"buy_cost" numeric(12, 2) NOT NULL,
	"deposit" varchar(255) NOT NULL,
	"gift" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false,
	"tenant_id" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accesory" ADD CONSTRAINT "accesory_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accessory_tenant_deleted_idx" ON "accesory" USING btree ("tenant_id","is_deleted");--> statement-breakpoint
CREATE INDEX "accessory_tenant_datetime_idx" ON "accesory" USING btree ("tenant_id","datetime");