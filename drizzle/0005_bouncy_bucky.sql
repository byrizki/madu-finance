CREATE TYPE "public"."transaction_activity_action" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TABLE "transaction_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"transaction_id" uuid NOT NULL,
	"actor_id" uuid,
	"action" "transaction_activity_action" NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transaction_activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "transaction_activities" ADD CONSTRAINT "transaction_activities_account_id_shared_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."shared_accounts"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "transaction_activities" ADD CONSTRAINT "transaction_activities_actor_id_members_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE cascade;