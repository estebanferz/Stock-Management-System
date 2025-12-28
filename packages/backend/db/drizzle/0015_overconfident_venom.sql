CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_used" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"role" "user_role" DEFAULT 'user',
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "phone" DROP CONSTRAINT "phone_imei_unique";--> statement-breakpoint
ALTER TABLE "client" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "phone" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "provider" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "repair" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "sale" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "seller" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "technician" ADD COLUMN "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "client" ADD CONSTRAINT "client_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone" ADD CONSTRAINT "phone_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider" ADD CONSTRAINT "provider_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair" ADD CONSTRAINT "repair_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller" ADD CONSTRAINT "seller_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "technician" ADD CONSTRAINT "technician_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_user_deleted_idx" ON "client" USING btree ("user_id","is_deleted");--> statement-breakpoint
CREATE UNIQUE INDEX "client_user_id_number_unique" ON "client" USING btree ("user_id","id_number");--> statement-breakpoint
CREATE INDEX "phone_user_deleted_idx" ON "phone" USING btree ("user_id","is_deleted");--> statement-breakpoint
CREATE INDEX "phone_user_sold_idx" ON "phone" USING btree ("user_id","sold");--> statement-breakpoint
CREATE INDEX "phone_user_datetime_idx" ON "phone" USING btree ("user_id","datetime");--> statement-breakpoint
CREATE UNIQUE INDEX "phone_user_imei_unique" ON "phone" USING btree ("user_id","imei");