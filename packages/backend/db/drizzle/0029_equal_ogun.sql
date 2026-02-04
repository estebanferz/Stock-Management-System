CREATE TYPE "public"."signup_intent_status" AS ENUM('created', 'pending', 'approved', 'rejected', 'expired', 'consumed');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('inactive', 'pending', 'active', 'past_due', 'canceled');--> statement-breakpoint
CREATE TABLE "mp_events" (
	"mp_event_id" text PRIMARY KEY NOT NULL,
	"intent_id" text,
	"topic" varchar(64) NOT NULL,
	"resource_id" varchar(128) NOT NULL,
	"tenant_id" integer,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "signup_intents" (
	"intent_id" text PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"plan_id" integer NOT NULL,
	"status" "signup_intent_status" DEFAULT 'created' NOT NULL,
	"mp_preapproval_id" varchar(128),
	"mp_init_point" text,
	"external_reference" varchar(128) NOT NULL,
	"approved_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"plan_id" serial PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"price_amount" numeric(12, 2) NOT NULL,
	"currency" varchar(8) DEFAULT 'ARS' NOT NULL,
	"mp_preapproval_plan_id" varchar(128) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscription_plans_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "repair" ADD COLUMN "currency_buy" varchar(8) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "repair" ADD COLUMN "currency_sale" varchar(8) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "subscription_status" "subscription_status" DEFAULT 'inactive' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "subscription_plan_id" integer;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "mp_preapproval_id" varchar(128);--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "subscription_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "current_period_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD COLUMN "last_mp_event_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "mp_events" ADD CONSTRAINT "mp_events_intent_id_signup_intents_intent_id_fk" FOREIGN KEY ("intent_id") REFERENCES "public"."signup_intents"("intent_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mp_events" ADD CONSTRAINT "mp_events_tenant_id_tenants_tenant_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("tenant_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signup_intents" ADD CONSTRAINT "signup_intents_plan_id_subscription_plans_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("plan_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "signup_intents_email_idx" ON "signup_intents" USING btree ("email");--> statement-breakpoint
CREATE INDEX "signup_intents_status_idx" ON "signup_intents" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "signup_intents_external_reference_unique" ON "signup_intents" USING btree ("external_reference");--> statement-breakpoint
ALTER TABLE "tenant_settings" ADD CONSTRAINT "tenant_settings_subscription_plan_id_subscription_plans_plan_id_fk" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("plan_id") ON DELETE no action ON UPDATE no action;