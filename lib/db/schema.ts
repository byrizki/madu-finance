import { relations } from "drizzle-orm";
import { pgEnum, pgTable, uuid, text, timestamp, numeric, date, uniqueIndex, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export * from "./auth-schema";

export const membershipRoleEnum = pgEnum("membership_role", ["owner", "member"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["income", "expense"]);
export const transactionActivityActionEnum = pgEnum("transaction_activity_action", ["create", "update", "delete"]);
export const walletTypeEnum = pgEnum("wallet_type", ["bank", "e_wallet", "credit_card", "cash"]);
export const installmentStatusEnum = pgEnum("installment_status", ["upcoming", "overdue", "paid"]);
export const budgetStatusEnum = pgEnum("budget_status", ["on-track", "warning", "over-budget"]);
export const budgetPeriodEnum = pgEnum("budget_period", ["weekly", "monthly", "quarterly", "yearly"]);

export const members = pgTable(
  "members",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url"),
    phone: text("phone"),
    address: text("address"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("members_email_idx").on(table.email),
  ]
).enableRLS();

export const sharedAccounts = pgTable(
  "shared_accounts",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade", onUpdate: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("shared_accounts_slug_idx").on(table.slug),
  ]
).enableRLS();

export const accountMembers = pgTable(
  "account_members",
  {
    id: uuid("id")
      .default(sql`gen_random_uuid()`)
      .primaryKey(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => sharedAccounts.id, { onDelete: "cascade", onUpdate: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade", onUpdate: "cascade" }),
    role: membershipRoleEnum("role").default("member").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("account_members_account_id_member_id_idx").on(table.accountId, table.memberId),
  ]
).enableRLS();

export const wallets = pgTable("wallets", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => sharedAccounts.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text("name").notNull(),
  type: walletTypeEnum("type").notNull(),
  provider: text("provider"),
  accountNumber: text("account_number"),
  color: text("color"),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const transactionActivities = pgTable("transaction_activities", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => sharedAccounts.id, { onDelete: "cascade", onUpdate: "cascade" }),
  transactionId: uuid("transaction_id").notNull(),
  actorId: uuid("actor_id").references(() => members.id, { onDelete: "set null", onUpdate: "cascade" }),
  action: transactionActivityActionEnum("action").notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const transactions = pgTable("transactions", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => sharedAccounts.id, { onDelete: "cascade", onUpdate: "cascade" }),
  walletId: uuid("wallet_id").references(() => wallets.id, { onDelete: "set null", onUpdate: "cascade" }),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "set null", onUpdate: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).defaultNow().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const budgets = pgTable("budgets", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => sharedAccounts.id, { onDelete: "cascade", onUpdate: "cascade" }),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  spentAmount: numeric("spent_amount", { precision: 12, scale: 2 }).default("0").notNull(),
  period: budgetPeriodEnum("period").default("monthly").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: budgetStatusEnum("status").default("on-track").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const installments = pgTable("installments", {
  id: uuid("id")
    .default(sql`gen_random_uuid()`)
    .primaryKey(),
  accountId: uuid("account_id")
    .notNull()
    .references(() => sharedAccounts.id, { onDelete: "cascade", onUpdate: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  provider: text("provider"),
  monthlyAmount: numeric("monthly_amount", { precision: 12, scale: 2 }).notNull(),
  remainingAmount: numeric("remaining_amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  status: installmentStatusEnum("status").default("upcoming").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}).enableRLS();

export const membersRelations = relations(members, ({ many }) => ({
  memberships: many(accountMembers),
  transactions: many(transactions),
  ownedAccounts: many(sharedAccounts, { relationName: "owner" }),
}));

export const sharedAccountsRelations = relations(sharedAccounts, ({ many, one }) => ({
  owner: one(members, {
    fields: [sharedAccounts.ownerId],
    references: [members.id],
    relationName: "owner",
  }),
  memberships: many(accountMembers),
  wallets: many(wallets),
  transactions: many(transactions),
  budgets: many(budgets),
  installments: many(installments),
}));

export const accountMembersRelations = relations(accountMembers, ({ one }) => ({
  member: one(members, {
    fields: [accountMembers.memberId],
    references: [members.id],
  }),
  account: one(sharedAccounts, {
    fields: [accountMembers.accountId],
    references: [sharedAccounts.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  account: one(sharedAccounts, {
    fields: [wallets.accountId],
    references: [sharedAccounts.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(sharedAccounts, {
    fields: [transactions.accountId],
    references: [sharedAccounts.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  member: one(members, {
    fields: [transactions.memberId],
    references: [members.id],
  }),
}));

export const transactionActivitiesRelations = relations(transactionActivities, ({ one }) => ({
  account: one(sharedAccounts, {
    fields: [transactionActivities.accountId],
    references: [sharedAccounts.id],
  }),
  actor: one(members, {
    fields: [transactionActivities.actorId],
    references: [members.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  account: one(sharedAccounts, {
    fields: [budgets.accountId],
    references: [sharedAccounts.id],
  }),
}));

export const installmentsRelations = relations(installments, ({ one }) => ({
  account: one(sharedAccounts, {
    fields: [installments.accountId],
    references: [sharedAccounts.id],
  }),
}));
