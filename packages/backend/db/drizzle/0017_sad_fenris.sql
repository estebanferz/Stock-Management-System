CREATE TYPE "public"."tenant_role" AS ENUM('owner', 'admin', 'staff');--> statement-breakpoint
CREATE TABLE "tenant_memberships" (
	"membership_id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "tenant_role" DEFAULT 'staff' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_settings" (
	"tenant_id" integer PRIMARY KEY NOT NULL,
	"business_name" varchar(255),
	"logo_url" varchar(1024),
	"cuit" varchar(32),
	"address" varchar(255),
	"default_currency" varchar(8) DEFAULT 'ARS' NOT NULL,
	"timezone" varchar(64) DEFAULT 'America/Argentina/Buenos_Aires' NOT NULL,
	"low_stock_threshold_default" integer DEFAULT 3 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"tenant_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client" RENAME COLUMN "user_id" TO "tenant_id";--> statement-breakpoint
ALTER TABLE "expense" RENAME COLUMN "user_id" TO "tenant_id";--> statement-breakpoint
ALTER TABLE "phone" RENAME COLUMN "user_id" TO "tenant_id";--> statement-breakpoint
ALTER TABLE "provider" RENAME COLUMN "user_id" TO "tenant_id";--> statement-breakpoint
ALTER TABLE "repair" RENAME COLUMN "user_id" TO "tenant_id";--> statement-breakpoint
ALTER TABLE "sale" RENAME COLUMN "user_id" TO "tenant_id";--> statement-breakpoint
ALTER TABLE "seller" RENAME COLUMN "user_id" TO "tenant_id";--> statement-breakpoint
ALTER TABLE "technician" RENAME COLUMN "user_id" TO "tenant_id";--> statement-breakpoint
ALTER TABLE "client" DROP CONSTRAINT "client_id_number_unique";--> statement-breakpoint
ALTER TABLE "client" DROP CONSTRAINT "client_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "expense" DROP CONSTRAINT "expense_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "phone" DROP CONSTRAINT "phone_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "provider" DROP CONSTRAINT "provider_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "repair" DROP CONSTRAINT "repair_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "sale" DROP CONSTRAINT "sale_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "seller" DROP CONSTRAINT "seller_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "technician" DROP CONSTRAINT "technician_user_id_users_user_id_fk";
--> statement-breakpoint
DROP INDEX "client_user_deleted_idx";--> statement-breakpoint
DROP INDEX "client_user_id_number_unique";--> statement-breakpoint
DROP INDEX "phone_user_deleted_idx";--> statement-breakpoint
DROP INDEX "phone_user_sold_idx";--> statement-breakpoint
DROP INDEX "phone_user_datetime_idx";--> statement-breakpoint
DROP INDEX "phone_user_imei_unique";--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "created_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "tenant_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_memberships" ADD CONSTRAINT "tenant_memberships_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_memberships_tenant_user_unique" ON "tenant_memberships" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "tenant_memberships_tenant_idx" ON "tenant_memberships" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "tenant_memberships_user_idx" ON "tenant_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tenants_name_idx" ON "tenants" USING btree ("name");--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_created_by_user_id_users_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone" ADD CONSTRAINT "phone_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider" ADD CONSTRAINT "provider_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair" ADD CONSTRAINT "repair_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller" ADD CONSTRAINT "seller_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technician" ADD CONSTRAINT "technician_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_tenant_deleted_idx" ON "client" USING btree ("tenant_id","is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "client_tenant_id_number_unique" ON "client" USING btree ("tenant_id","id_number");--> statement-breakpoint
CREATE INDEX "expense_tenant_deleted_idx" ON "expense" USING btree ("tenant_id","is_deleted");--> statement-breakpoint
CREATE INDEX "expense_tenant_datetime_idx" ON "expense" USING btree ("tenant_id","datetime");--> statement-breakpoint
CREATE INDEX "phone_tenant_deleted_idx" ON "phone" USING btree ("tenant_id","is_deleted");--> statement-breakpoint
CREATE INDEX "phone_tenant_sold_idx" ON "phone" USING btree ("tenant_id","sold");--> statement-breakpoint
CREATE INDEX "phone_tenant_datetime_idx" ON "phone" USING btree ("tenant_id","datetime");--> statement-breakpoint
CREATE UNIQUE INDEX "phone_tenant_imei_unique" ON "phone" USING btree ("tenant_id","imei");--> statement-breakpoint
CREATE INDEX "provider_tenant_deleted_idx" ON "provider" USING btree ("tenant_id","is_deleted");--> statement-breakpoint
CREATE INDEX "repair_tenant_deleted_idx" ON "repair" USING btree ("tenant_id","is_deleted");--> statement-breakpoint
CREATE INDEX "repair_tenant_datetime_idx" ON "repair" USING btree ("tenant_id","datetime");--> statement-breakpoint
CREATE INDEX "sale_tenant_deleted_idx" ON "sale" USING btree ("tenant_id","is_deleted");--> statement-breakpoint
CREATE INDEX "sale_tenant_datetime_idx" ON "sale" USING btree ("tenant_id","datetime");--> statement-breakpoint
CREATE INDEX "seller_tenant_deleted_idx" ON "seller" USING btree ("tenant_id","is_deleted");--> statement-breakpoint
CREATE INDEX "technician_tenant_deleted_idx" ON "technician" USING btree ("tenant_id","is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");