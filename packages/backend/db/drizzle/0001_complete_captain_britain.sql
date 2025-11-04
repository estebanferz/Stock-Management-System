ALTER TABLE "technician" RENAME COLUMN "birth_date" TO "state";--> statement-breakpoint
ALTER TABLE "technician" ALTER COLUMN "speciality" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "phone" ADD COLUMN "datetime" timestamp NOT NULL;