CREATE TABLE "client" (
	"client_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "client_client_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone_number" varchar(16),
	"id_number" bigint NOT NULL,
	"birth_date" date,
	CONSTRAINT "client_id_number_unique" UNIQUE("id_number")
);
--> statement-breakpoint
CREATE TABLE "expense" (
	"expense_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "expense_expense_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"datetime" timestamp DEFAULT now() NOT NULL,
	"category" varchar(255) NOT NULL,
	"description" varchar(255),
	"amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"receipt_number" varchar(100),
	"provider_id" integer,
	CONSTRAINT "expense_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
CREATE TABLE "phone" (
	"device_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "phone_device_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"datetime" timestamp DEFAULT now() NOT NULL,
	"name" varchar(255) NOT NULL,
	"brand" varchar(100) NOT NULL,
	"imei" varchar(100) NOT NULL,
	"device_type" varchar(100) NOT NULL,
	"battery_health" integer,
	"storage_capacity" integer,
	"color" varchar(50),
	"category" varchar(100) NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"buy_cost" numeric(12, 2) NOT NULL,
	"deposit" varchar(255) NOT NULL,
	"sold" boolean DEFAULT false NOT NULL,
	"trade_in" boolean DEFAULT false,
	CONSTRAINT "phone_imei_unique" UNIQUE("imei")
);
--> statement-breakpoint
CREATE TABLE "provider" (
	"provider_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "provider_provider_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"phone_number" varchar(255) NOT NULL,
	"email" varchar(255),
	"address" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair" (
	"repair_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "repair_repair_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"datetime" timestamp DEFAULT now() NOT NULL,
	"repair_state" varchar(100) NOT NULL,
	"priority" varchar(50) NOT NULL,
	"description" varchar(255) NOT NULL,
	"diagnostic" varchar(255),
	"client_cost" numeric(12, 2) NOT NULL,
	"internal_cost" numeric(12, 2) NOT NULL,
	"client_id" integer NOT NULL,
	"technician_id" integer NOT NULL,
	"device_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale" (
	"sale_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sale_sale_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"datetime" timestamp DEFAULT now() NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"debt" boolean DEFAULT false NOT NULL,
	"debt_amount" numeric(12, 2),
	"client_id" integer NOT NULL,
	"seller_id" integer NOT NULL,
	"device_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seller" (
	"seller_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "seller_seller_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"age" integer NOT NULL,
	"email" varchar(255),
	"phone_number" varchar(16),
	"hire_date" date DEFAULT now() NOT NULL,
	"pay_date" date
);
--> statement-breakpoint
CREATE TABLE "technician" (
	"technician_id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "technician_technician_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone_number" varchar(16),
	"speciality" varchar(255) NOT NULL,
	"state" varchar(100) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_provider_id_provider_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("provider_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair" ADD CONSTRAINT "repair_client_id_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("client_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair" ADD CONSTRAINT "repair_technician_id_technician_technician_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technician"("technician_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair" ADD CONSTRAINT "repair_device_id_phone_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."phone"("device_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_client_id_client_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("client_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_seller_id_seller_seller_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."seller"("seller_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale" ADD CONSTRAINT "sale_device_id_phone_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."phone"("device_id") ON DELETE no action ON UPDATE no action;