ALTER TABLE "accesory" RENAME TO "accessory";--> statement-breakpoint
ALTER TABLE "accessory" RENAME COLUMN "accesory_id" TO "accessory_id";--> statement-breakpoint
ALTER TABLE "accessory" DROP CONSTRAINT "accesory_tenant_id_tenants_tenant_id_fk";
--> statement-breakpoint
ALTER TABLE "accessory" ADD CONSTRAINT "accessory_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;