CREATE TABLE "app_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"version" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"release_date" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_major" boolean DEFAULT false NOT NULL,
	"short_description" text NOT NULL,
	"full_release_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_versions_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "user_version_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"version_id" integer NOT NULL,
	"has_seen_popup" boolean DEFAULT false NOT NULL,
	"seen_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_version_tracking" ADD CONSTRAINT "user_version_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_version_tracking" ADD CONSTRAINT "user_version_tracking_version_id_app_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."app_versions"("id") ON DELETE cascade ON UPDATE no action;