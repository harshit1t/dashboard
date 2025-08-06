CREATE TABLE "owners" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"team_id" integer NOT NULL,
	CONSTRAINT "owners_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "owners" ADD CONSTRAINT "owners_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE no action ON UPDATE no action;