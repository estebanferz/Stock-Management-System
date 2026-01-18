ALTER TABLE "expense" ADD COLUMN "sale_id" integer;--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_sale_id_sale_sale_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sale"("sale_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expense_tenant_sale_idx" ON "expense" USING btree ("tenant_id","sale_id");