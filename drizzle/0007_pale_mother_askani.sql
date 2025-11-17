CREATE TABLE "custom_stat_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"categories" jsonb NOT NULL,
	"color" text DEFAULT 'emerald',
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "custom_stat_cards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "custom_stat_cards" ADD CONSTRAINT "custom_stat_cards_account_id_shared_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."shared_accounts"("id") ON DELETE cascade ON UPDATE cascade;