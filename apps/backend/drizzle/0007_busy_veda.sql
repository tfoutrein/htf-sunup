CREATE TABLE "proofs" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" varchar(500) NOT NULL,
	"type" varchar(50) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"size" integer NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"user_action_id" integer,
	"daily_bonus_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_user_action_id_user_actions_id_fk" FOREIGN KEY ("user_action_id") REFERENCES "public"."user_actions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_daily_bonus_id_daily_bonus_id_fk" FOREIGN KEY ("daily_bonus_id") REFERENCES "public"."daily_bonus"("id") ON DELETE cascade ON UPDATE no action;