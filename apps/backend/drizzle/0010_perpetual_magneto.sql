CREATE TYPE "public"."validation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "campaign_validations" ADD COLUMN "status" "validation_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "campaign_validations" DROP COLUMN "is_validated";