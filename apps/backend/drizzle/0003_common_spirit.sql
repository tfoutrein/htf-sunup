ALTER TABLE "challenges" ADD COLUMN "value_in_euro" numeric(10, 2) DEFAULT '0.50' NOT NULL;--> statement-breakpoint
ALTER TABLE "actions" DROP COLUMN "points_value";