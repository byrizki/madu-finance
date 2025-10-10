ALTER TABLE "shared_accounts" DROP CONSTRAINT "shared_accounts_share_code_unique";--> statement-breakpoint
DROP INDEX "account_member_account_id_member_id_idx";--> statement-breakpoint
DROP INDEX "shared_accounts_share_code_idx";--> statement-breakpoint
ALTER TABLE "shared_accounts" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "account_members_account_id_member_id_idx" ON "account_members" USING btree ("account_id","member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shared_accounts_slug_idx" ON "shared_accounts" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "shared_accounts" DROP COLUMN "share_code";--> statement-breakpoint
ALTER TABLE "shared_accounts" ADD CONSTRAINT "shared_accounts_slug_unique" UNIQUE("slug");