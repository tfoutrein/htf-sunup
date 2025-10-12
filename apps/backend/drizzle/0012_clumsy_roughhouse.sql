CREATE TABLE "campaign_unlock_conditions" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer NOT NULL,
	"description" text NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_validation_conditions" (
	"id" serial PRIMARY KEY NOT NULL,
	"validation_id" integer NOT NULL,
	"condition_id" integer NOT NULL,
	"is_fulfilled" boolean DEFAULT false NOT NULL,
	"fulfilled_at" timestamp,
	"fulfilled_by" integer,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_unlock_conditions" ADD CONSTRAINT "campaign_unlock_conditions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_validation_conditions" ADD CONSTRAINT "campaign_validation_conditions_validation_id_campaign_validations_id_fk" FOREIGN KEY ("validation_id") REFERENCES "public"."campaign_validations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_validation_conditions" ADD CONSTRAINT "campaign_validation_conditions_condition_id_campaign_unlock_conditions_id_fk" FOREIGN KEY ("condition_id") REFERENCES "public"."campaign_unlock_conditions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_validation_conditions" ADD CONSTRAINT "campaign_validation_conditions_fulfilled_by_users_id_fk" FOREIGN KEY ("fulfilled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;