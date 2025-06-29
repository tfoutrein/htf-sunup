CREATE TABLE "access_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"requested_role" varchar(50) DEFAULT 'fbo' NOT NULL,
	"requested_manager_id" integer,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"message" text,
	"reviewed_by" integer,
	"reviewed_at" timestamp,
	"review_comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_requests_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_requested_manager_id_users_id_fk" FOREIGN KEY ("requested_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;