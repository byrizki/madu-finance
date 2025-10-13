import type { InferSelectModel } from "drizzle-orm";

import {
  accountMembers,
  budgets,
  budgetPeriodEnum,
  budgetStatusEnum,
  installments,
  installmentStatusEnum,
  members,
  membershipRoleEnum,
  sharedAccounts,
  transactions,
  transactionTypeEnum,
  walletTypeEnum,
  wallets,
  transactionActivities,
  transactionActivityActionEnum,
} from "./schema";

type SerializeDates<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K];
};

export type SharedAccountRecord = InferSelectModel<typeof sharedAccounts>;
export type AccountMemberRecord = InferSelectModel<typeof accountMembers>;
export type MemberRecord = InferSelectModel<typeof members>;
export type WalletRecord = InferSelectModel<typeof wallets>;
export type BudgetRecord = InferSelectModel<typeof budgets>;
export type InstallmentRecord = InferSelectModel<typeof installments>;
export type TransactionRecord = InferSelectModel<typeof transactions>;

export type SharedAccountRow = SerializeDates<SharedAccountRecord>;
export type AccountMemberRow = SerializeDates<AccountMemberRecord>;
export type MemberRow = SerializeDates<MemberRecord>;
export type WalletRow = SerializeDates<WalletRecord>;
export type WalletSummary = Pick<WalletRecord, "id" | "name" | "type" | "color">;
export type BudgetRow = SerializeDates<BudgetRecord>;
export type InstallmentRow = SerializeDates<InstallmentRecord>;
export type TransactionRow = SerializeDates<TransactionRecord>;
export type TransactionActivityRecord = InferSelectModel<typeof transactionActivities>;
export type TransactionActivityRow = SerializeDates<TransactionActivityRecord>;
export type TransactionActivityAction = (typeof transactionActivityActionEnum.enumValues)[number];

export type SharedAccountWithOwnerRecord = SharedAccountRecord & {
  owner?: MemberRecord | null;
};

export type SharedAccountWithOwnerRow = SerializeDates<SharedAccountWithOwnerRecord>;

export type WalletType = (typeof walletTypeEnum.enumValues)[number];
export type BudgetStatus = (typeof budgetStatusEnum.enumValues)[number];
export type BudgetPeriod = (typeof budgetPeriodEnum.enumValues)[number];
export type InstallmentStatus = (typeof installmentStatusEnum.enumValues)[number];
export type MembershipRole = (typeof membershipRoleEnum.enumValues)[number];
export type TransactionType = (typeof transactionTypeEnum.enumValues)[number];
