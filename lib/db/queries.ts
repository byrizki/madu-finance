import { db, type DbClient } from "./index";
import { formatCompactCurrency, randomSlugSuffix, slugify } from "../utils";
import {
  members,
  sharedAccounts,
  accountMembers,
  wallets,
  transactions,
  transactionActivities,
  budgets,
  installments,
} from "./schema";
import { and, asc, desc, eq, gte, ilike, inArray, lt } from "drizzle-orm";

import type { TransactionActivityAction, WalletSummary } from "./types";

type DbExecutor = Pick<DbClient, "query" | "insert" | "update">;

const normalizeAmount = (value: number) => Math.round(value * 100) / 100;

const toNumericString = (value: number) => normalizeAmount(value).toFixed(2);

const parseNumeric = (value: string | number | null | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
};

async function getAccountIdBySlug(accountSlug: string): Promise<string | null> {
  const normalizedSlug = accountSlug.trim();
  if (!normalizedSlug) {
    return null;
  }

  const account = await db.query.sharedAccounts.findFirst({
    where: eq(sharedAccounts.slug, normalizedSlug),
    columns: { id: true },
  });

  return account?.id ?? null;
}

async function requireAccountId(accountSlug: string): Promise<string> {
  const accountId = await getAccountIdBySlug(accountSlug);
  if (!accountId) {
    throw new Error(`Account not found for slug: ${accountSlug}`);
  }

  return accountId;
}

const toIsoString = (value: Date | null | undefined) => (value ? value.toISOString() : null);

const serializeTransactionForPayload = (transaction: typeof transactions.$inferSelect | null) => {
  if (!transaction) {
    return null;
  }

  return {
    id: transaction.id,
    walletId: transaction.walletId,
    memberId: transaction.memberId,
    type: transaction.type,
    title: transaction.title,
    category: transaction.category,
    amount: transaction.amount,
    occurredAt: toIsoString(transaction.occurredAt),
    description: transaction.description,
    createdAt: toIsoString(transaction.createdAt),
    updatedAt: toIsoString(transaction.updatedAt),
  };
};

async function logTransactionActivity(
  client: DbExecutor,
  input: {
    accountId: string;
    transactionId: string;
    actorId?: string | null;
    action: TransactionActivityAction;
    payload?: unknown;
  },
) {
  await client.insert(transactionActivities).values({
    accountId: input.accountId,
    transactionId: input.transactionId,
    actorId: input.actorId ?? null,
    action: input.action,
    payload: input.payload ?? null,
  });
}

type TransactionSelect = typeof transactions.$inferSelect;
type MemberSelect = typeof members.$inferSelect;
type TransactionActivitySelect = typeof transactionActivities.$inferSelect;
type WalletSelect = typeof wallets.$inferSelect;

type TransactionSelectWithRelations = TransactionSelect & {
  wallet?: WalletSummary | null;
};

export type TransactionWithLatestActivity = TransactionSelectWithRelations & {
  latestActivity: {
    actorId: string | null;
    actorName: string | null;
    actorAvatarUrl: string | null;
    action: TransactionActivityAction;
    createdAt: Date;
  } | null;
};

type TransactionActivityWithActor = TransactionActivitySelect & {
  actor: Pick<MemberSelect, "id" | "name" | "avatarUrl"> | null;
};

const summarizeWallet = (wallet: WalletSelect | WalletSummary | null | undefined): WalletSummary | null => {
  if (!wallet) {
    return null;
  }

  return {
    id: wallet.id,
    name: wallet.name,
    type: wallet.type,
    color: wallet.color ?? null,
  } satisfies WalletSummary;
};

async function getWalletSummaryForAccount(
  accountId: string,
  walletId: string,
  client: DbExecutor = db,
): Promise<WalletSummary | null> {
  const wallet = await client.query.wallets.findFirst({
    where: and(eq(wallets.id, walletId), eq(wallets.accountId, accountId)),
    columns: {
      id: true,
      name: true,
      type: true,
      color: true,
    },
  });

  if (!wallet) {
    return null;
  }

  return summarizeWallet(wallet);
}

async function applyWalletDelta(
  client: DbExecutor,
  accountId: string,
  walletId: string,
  delta: number,
): Promise<WalletSummary> {
  if (!Number.isFinite(delta)) {
    throw new Error("Invalid amount");
  }

  const currentWallet = await client.query.wallets.findFirst({
    where: and(eq(wallets.id, walletId), eq(wallets.accountId, accountId)),
  });

  if (!currentWallet) {
    throw new Error("Dompet tidak ditemukan");
  }

  const normalizedDelta = normalizeAmount(delta);
  if (normalizedDelta === 0) {
    return summarizeWallet(currentWallet)!;
  }

  const currentBalance = parseNumeric(currentWallet.balance);
  const nextBalance = normalizeAmount(currentBalance + normalizedDelta);

  if (nextBalance < 0) {
    throw new Error("Saldo dompet tidak mencukupi");
  }

  const [updatedWallet] = await client
    .update(wallets)
    .set({
      balance: toNumericString(nextBalance),
      updatedAt: new Date(),
    })
    .where(and(eq(wallets.id, walletId), eq(wallets.accountId, accountId)))
    .returning();

  if (!updatedWallet) {
    throw new Error("Dompet tidak ditemukan");
  }

  return summarizeWallet(updatedWallet)!;
}

async function attachLatestActivities(
  accountId: string,
  items: TransactionSelectWithRelations[],
): Promise<Array<TransactionSelectWithRelations & TransactionWithLatestActivity>> {
  if (items.length === 0) {
    return items.map((item) => ({ ...item, latestActivity: null }));
  }

  const transactionIds = items.map((item) => item.id);

  const activities = (await db.query.transactionActivities.findMany({
    where: and(eq(transactionActivities.accountId, accountId), inArray(transactionActivities.transactionId, transactionIds)),
    with: {
      actor: {
        columns: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: (fields, operators) => operators.desc(fields.createdAt),
  })) as TransactionActivityWithActor[];

  const latestActivityMap = new Map<string, TransactionActivityWithActor>();

  for (const activity of activities) {
    if (!latestActivityMap.has(activity.transactionId)) {
      latestActivityMap.set(activity.transactionId, activity);
    }
  }

  return items.map((item) => {
    const latest = latestActivityMap.get(item.id);

    const withActivity: TransactionWithLatestActivity = {
      ...item,
      latestActivity: latest
        ? {
            actorId: latest.actorId ?? null,
            actorName: latest.actor?.name ?? null,
            actorAvatarUrl: latest.actor?.avatarUrl ?? null,
            action: latest.action,
            createdAt: latest.createdAt,
          }
        : null,
    };
    return withActivity;
  });
}

const buildAccountQuickInsight = (monthlyIncome: number, monthlyExpense: number) => {
  const income = monthlyIncome;
  const expense = monthlyExpense;

  if (income === 0 && expense === 0) {
    return "Belum ada aktivitas bulan ini";
  }

  if (income > expense) {
    const savings = income - expense;
    return `Tabungan bertambah ${formatCompactCurrency(savings)} bulan ini.`;
  }

  if (expense > income) {
    const deficit = expense - income;
    return `Pengeluaran melebihi pemasukan ${formatCompactCurrency(deficit)}.`;
  }

  return "Keuangan seimbang bulan ini.";
};

export async function getAccountsForMember(memberId: string, email?: string | null) {
  const memberIds = new Set<string>([memberId]);

  if (email) {
    const matchingMembers = await db.query.members.findMany({
      where: eq(members.email, email),
    });

    for (const member of matchingMembers) {
      if (member.id) {
        memberIds.add(member.id);
      }
    }
  }

  const ids = Array.from(memberIds).filter(Boolean);
  if (ids.length === 0) {
    return [];
  }

  const memberships = await db.query.accountMembers.findMany({
    where: inArray(accountMembers.memberId, ids),
    with: {
      account: true,
    },
  });

  const uniqueAccounts = new Map<
    string,
    {
      membership: typeof accountMembers.$inferSelect;
      account: NonNullable<(typeof memberships)[number]["account"]>;
    }
  >();

  for (const membership of memberships) {
    if (!membership.account) {
      continue;
    }

    uniqueAccounts.set(membership.accountId, {
      membership,
      account: membership.account,
    });
  }

  if (uniqueAccounts.size === 0) {
    return [];
  }

  const accountIds = Array.from(uniqueAccounts.keys());

  const accountMemberships = await db.query.accountMembers.findMany({
    where: inArray(accountMembers.accountId, accountIds),
    with: {
      member: true,
    },
  });

  const membersByAccount = new Map<string, typeof accountMemberships>();
  for (const row of accountMemberships) {
    const list = membersByAccount.get(row.accountId);
    if (list) {
      list.push(row);
    } else {
      membersByAccount.set(row.accountId, [row]);
    }
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const transactionRows = await db
    .select({
      accountId: transactions.accountId,
      type: transactions.type,
      amount: transactions.amount,
    })
    .from(transactions)
    .where(
      and(
        inArray(transactions.accountId, accountIds),
        gte(transactions.occurredAt, startOfMonth),
        lt(transactions.occurredAt, endOfMonth)
      )
    );

  const aggregateByAccount = new Map<string, { income: number; expense: number }>();
  for (const row of transactionRows) {
    const amount = parseNumeric(row.amount);
    const current = aggregateByAccount.get(row.accountId) ?? { income: 0, expense: 0 };
    if (row.type === "income") {
      current.income += amount;
    } else {
      current.expense += Math.abs(amount);
    }
    aggregateByAccount.set(row.accountId, current);
  }

  return accountIds.map((accountId) => {
    const entry = uniqueAccounts.get(accountId);
    if (!entry) {
      throw new Error("Account metadata missing after aggregation");
    }

    const { membership, account } = entry;
    const aggregates = aggregateByAccount.get(accountId) ?? { income: 0, expense: 0 };
    const accountMembersList = membersByAccount.get(accountId) ?? [];

    return {
      id: accountId,
      slug: account.slug,
      name: account.name ?? "Kas Tanpa Nama",
      role: membership.role,
      isOwner: membership.role === "owner",
      isDefault: Boolean(membership.isDefault),
      monthlyIncome: aggregates.income,
      monthlyExpense: aggregates.expense,
      quickInsight: buildAccountQuickInsight(aggregates.income, aggregates.expense),
      members: accountMembersList.map((item) => ({
        id: item.memberId,
        role: item.role,
        name: item.member?.name ?? "Pengguna",
        email: item.member?.email ?? "",
        avatarEndpoint: `/api/profile/${item.memberId}`,
      })),
    };
  });
}

export async function findMembershipForUser(accountSlug: string, memberId: string, email?: string | null) {
  const accountId = await requireAccountId(accountSlug);

  const memberships = await db.query.accountMembers.findMany({
    where: eq(accountMembers.accountId, accountId),
    with: {
      member: true,
    },
  });

  return memberships.find((membership) => {
    if (membership.memberId === memberId) {
      return true;
    }

    if (email && membership.member?.email === email) {
      return true;
    }

    return false;
  });
}

export async function getAccountDetailsBySlug(slug: string) {
  const account = await db.query.sharedAccounts.findFirst({
    where: eq(sharedAccounts.slug, slug),
    with: {
      owner: true,
    },
  });

  if (!account) {
    return null;
  }

  return account;
}

export async function getAccountDetailsById(accountId: string) {
  const account = await db.query.sharedAccounts.findFirst({
    where: eq(sharedAccounts.id, accountId),
    with: {
      owner: true,
    },
  });

  if (!account) {
    return null;
  }
  return account;
}

export async function updateAccountDetails(
  accountSlug: string,
  values: {
    name?: string;
    slug?: string;
  }
) {
  const accountId = await requireAccountId(accountSlug);
  const updatePayload: Partial<typeof sharedAccounts.$inferInsert> = {};
  let nextSlug: string | undefined;

  if (values.name !== undefined) {
    updatePayload.name = values.name;
  }

  if (values.slug !== undefined) {
    const baseSource = values.slug || values.name || "Kas";
    const baseSlug = slugify(baseSource) || "Kas";
    let candidate = baseSlug;
    if (candidate.length < 3) {
      candidate = `${candidate}-${randomSlugSuffix()}`;
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const existing = await db.query.sharedAccounts.findFirst({
        where: eq(sharedAccounts.slug, candidate),
        columns: { id: true },
      });

      if (!existing || existing.id === accountId) {
        nextSlug = candidate;
        break;
      }

      candidate = `${baseSlug}-${randomSlugSuffix()}`;
    }

    if (!nextSlug) {
      throw new Error("Failed to generate unique account slug");
    }
  }

  if (Object.keys(updatePayload).length === 0 && nextSlug === undefined) {
    return null;
  }

  updatePayload.updatedAt = new Date();
  if (nextSlug !== undefined) {
    updatePayload.slug = nextSlug;
  }

  const [account] = await db
    .update(sharedAccounts)
    .set(updatePayload)
    .where(eq(sharedAccounts.id, accountId))
    .returning();

  return account ?? null;
}

export async function getAccountMembers(accountSlug: string) {
  const accountId = await requireAccountId(accountSlug);
  const rows = await db.query.accountMembers.findMany({
    where: eq(accountMembers.accountId, accountId),
    with: {
      member: true,
    },
  });

  return rows.map((row) => ({
    id: row.memberId,
    role: row.role,
    isDefault: Boolean(row.isDefault),
    createdAt: row.createdAt,
    name: row.member?.name ?? "",
    email: row.member?.email ?? "",
    avatarEndpoint: `/api/profile/${row.memberId}`,
  }));
}

export async function getRecentTransactions(accountSlug: string, limit = 10) {
  const accountId = await requireAccountId(accountSlug);
  const rows = await db.query.transactions.findMany({
    where: eq(transactions.accountId, accountId),
    orderBy: (fields, operators) => operators.desc(fields.occurredAt),
    limit,
  });

  return rows;
}

export async function getAccountCategorySuggestions(
  accountSlug: string,
  options: { search?: string; limit?: number } = {},
) {
  const accountId = await requireAccountId(accountSlug);
  const searchTerm = options.search?.trim() ?? "";
  const limit = Math.min(Math.max(options.limit ?? 10, 1), 50);

  const transactionWhere = searchTerm
    ? and(eq(transactions.accountId, accountId), ilike(transactions.category, `${searchTerm}%`))
    : eq(transactions.accountId, accountId);

  const budgetWhere = searchTerm
    ? and(eq(budgets.accountId, accountId), ilike(budgets.category, `${searchTerm}%`))
    : eq(budgets.accountId, accountId);

  const [transactionRows, budgetRows] = await Promise.all([
    db
      .selectDistinct({ category: transactions.category })
      .from(transactions)
      .where(transactionWhere)
      .orderBy(asc(transactions.category))
      .limit(limit),
    db
      .selectDistinct({ category: budgets.category })
      .from(budgets)
      .where(budgetWhere)
      .orderBy(asc(budgets.category))
      .limit(limit),
  ]);

  const categories = new Set<string>();
  for (const row of transactionRows) {
    if (row.category) {
      categories.add(row.category);
      if (categories.size >= limit) {
        return Array.from(categories);
      }
    }
  }

  for (const row of budgetRows) {
    if (row.category && !categories.has(row.category)) {
      categories.add(row.category);
      if (categories.size >= limit) {
        break;
      }
    }
  }

  return Array.from(categories).slice(0, limit);
}

export async function getDashboardSummary(accountSlug: string) {
  const [account, walletsRows, transactionsRows, installmentsRows] = await Promise.all([
    getAccountDetailsBySlug(accountSlug),
    getWallets(accountSlug),
    getRecentTransactions(accountSlug, 20),
    getInstallments(accountSlug),
  ]);

  if (!account) {
    return null;
  }

  return {
    account,
    wallets: walletsRows,
    transactions: transactionsRows,
    installments: installmentsRows,
  };
}

export async function createMember(
  accountSlug: string,
  data: { email: string; name?: string; role?: "owner" | "member" }
) {
  const accountId = await requireAccountId(accountSlug);
  const existingMember = await db.query.members.findFirst({
    where: eq(members.email, data.email),
  });

  const member =
    existingMember ??
    (
      await db
        .insert(members)
        .values({
          email: data.email,
          name: data.name ?? data.email.split("@")[0],
        })
        .returning()
    )[0];

  if (!member) {
    throw new Error("Failed to create or retrieve member");
  }

  if (data.name && member.name !== data.name) {
    const [updatedMember] = await db
      .update(members)
      .set({ name: data.name, updatedAt: new Date() })
      .where(eq(members.id, member.id))
      .returning();

    if (updatedMember) {
      Object.assign(member, updatedMember);
    }
  }

  const existingMembership = await db.query.accountMembers.findFirst({
    where: and(eq(accountMembers.accountId, accountId), eq(accountMembers.memberId, member.id)),
  });

  if (existingMembership) {
    if (data.role && existingMembership.role !== data.role) {
      await db
        .update(accountMembers)
        .set({ role: data.role, updatedAt: new Date() })
        .where(eq(accountMembers.id, existingMembership.id));
      existingMembership.role = data.role;
    }

    return { ...member, role: existingMembership.role };
  }

  const [accountMember] = await db
    .insert(accountMembers)
    .values({
      accountId,
      memberId: member.id,
      role: data.role ?? "member",
    })
    .returning();

  if (!accountMember) {
    throw new Error("Failed to create account membership");
  }

  return { ...member, role: accountMember.role };
}

export async function removeMember(accountSlug: string, memberId: string) {
  const accountId = await requireAccountId(accountSlug);
  const deleted = await db
    .delete(accountMembers)
    .where(and(eq(accountMembers.accountId, accountId), eq(accountMembers.memberId, memberId)))
    .returning();

  return deleted.length > 0;
}

export async function transferAccountOwnership(accountSlug: string, nextOwnerMemberId: string) {
  const accountId = await requireAccountId(accountSlug);

  const membership = await db.query.accountMembers.findFirst({
    where: and(eq(accountMembers.accountId, accountId), eq(accountMembers.memberId, nextOwnerMemberId)),
  });

  if (!membership) {
    throw new Error("Target member is not part of this account");
  }

  await db.transaction(async (txn) => {
    await txn
      .update(sharedAccounts)
      .set({ ownerId: nextOwnerMemberId, updatedAt: new Date() })
      .where(eq(sharedAccounts.id, accountId));

    await txn
      .update(accountMembers)
      .set({ role: "member", updatedAt: new Date() })
      .where(and(eq(accountMembers.accountId, accountId), eq(accountMembers.role, "owner")));

    await txn
      .update(accountMembers)
      .set({ role: "owner", updatedAt: new Date() })
      .where(and(eq(accountMembers.accountId, accountId), eq(accountMembers.memberId, nextOwnerMemberId)));
  });
}

export async function deleteSharedAccountCascade(accountSlug: string) {
  const accountId = await requireAccountId(accountSlug);

  await db.transaction(async (txn) => {
    await txn.delete(transactions).where(eq(transactions.accountId, accountId));
    await txn.delete(wallets).where(eq(wallets.accountId, accountId));
    await txn.delete(budgets).where(eq(budgets.accountId, accountId));
    await txn.delete(installments).where(eq(installments.accountId, accountId));
    await txn.delete(accountMembers).where(eq(accountMembers.accountId, accountId));
    await txn.delete(sharedAccounts).where(eq(sharedAccounts.id, accountId));
  });
}

export async function updateMember(
  accountSlug: string,
  memberId: string,
  values: {
    name?: string;
    email?: string;
    avatarUrl?: string | null;
    phone?: string | null;
    address?: string | null;
  }
) {
  const accountId = await requireAccountId(accountSlug);
  const membership = await db.query.accountMembers.findFirst({
    where: and(eq(accountMembers.accountId, accountId), eq(accountMembers.memberId, memberId)),
  });

  if (!membership) {
    throw new Error("Member not found for this account");
  }

  const payload: Partial<typeof members.$inferInsert> = {};

  if (values.name !== undefined) {
    payload.name = values.name;
  }

  if (values.email !== undefined) {
    payload.email = values.email;
  }

  if (values.avatarUrl !== undefined) {
    payload.avatarUrl = values.avatarUrl ?? null;
  }

  if (values.phone !== undefined) {
    payload.phone = values.phone ?? null;
  }

  if (values.address !== undefined) {
    payload.address = values.address ?? null;
  }

  if (Object.keys(payload).length === 0) {
    return null;
  }

  payload.updatedAt = new Date();

  const [member] = await db.update(members).set(payload).where(eq(members.id, memberId)).returning();

  if (!member) {
    throw new Error("Failed to update member record");
  }

  return member;
}

export async function getMemberAvatar(memberId: string) {
  const normalizedId = memberId.trim();
  if (!normalizedId) {
    return null;
  }

  const member = await db.query.members.findFirst({
    where: eq(members.id, normalizedId),
    columns: {
      name: true,
      avatarUrl: true,
    },
  });

  return member?.avatarUrl ?? `https://api.dicebear.com/9.x/adventurer/svg?seed=${member?.name ?? memberId}`;
}

export function createUniqueSlug(baseName: string) {
  const normalized = slugify(baseName) || "Kas";
  return `${normalized}-${randomSlugSuffix()}`;
}

export async function isAccountSlugAvailable(slug: string, options: { excludeSlug?: string } = {}) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return false;
  }

  const normalizedExclude = options.excludeSlug?.trim();
  if (normalizedExclude && normalizedExclude === normalizedSlug) {
    return true;
  }

  const existing = await db.query.sharedAccounts.findFirst({
    where: eq(sharedAccounts.slug, normalizedSlug),
    columns: { id: true, slug: true },
  });

  if (!existing) {
    return true;
  }

  return normalizedExclude ? existing.slug === normalizedExclude : false;
}

export async function getTransactions(accountSlug: string) {
  const accountId = await requireAccountId(accountSlug);
  const rows = await db.query.transactions.findMany({
    where: eq(transactions.accountId, accountId),
    with: {
      wallet: {
        columns: {
          id: true,
          name: true,
          type: true,
          color: true,
        },
      },
    },
    orderBy: (fields, operators) => operators.desc(fields.occurredAt),
    limit: 100,
  });

  const normalized = rows.map((row) => ({
    ...row,
    wallet: summarizeWallet(row.wallet),
  }));

  return attachLatestActivities(accountId, normalized);
}

interface TransactionActorOptions {
  actorId?: string | null;
}

export async function createTransaction(
  accountSlug: string,
  values: {
    walletId?: string;
    memberId?: string;
    type: "income" | "expense";
    title: string;
    category: string;
    amount: number;
    occurredAt: Date;
    description?: string;
  },
  options: TransactionActorOptions = {},
) {
  const accountId = await requireAccountId(accountSlug);
  const result = await db.transaction(async (tx) => {
    let walletSummary: WalletSummary | null | undefined;

    if (values.walletId !== undefined) {
      if (values.walletId === null) {
        walletSummary = null;
      } else {
        const amountDelta = values.type === "income" ? normalizeAmount(values.amount) : -normalizeAmount(values.amount);
        walletSummary = await applyWalletDelta(tx, accountId, values.walletId, amountDelta);
      }
    }

    const [transaction] = await tx
      .insert(transactions)
      .values({
        accountId,
        walletId: values.walletId,
        memberId: values.memberId,
        type: values.type,
        title: values.title,
        category: values.category,
        amount: toNumericString(values.amount),
        occurredAt: values.occurredAt,
        description: values.description,
      })
      .returning();

    if (!transaction) {
      throw new Error("Failed to create transaction");
    }

    await logTransactionActivity(tx, {
      accountId,
      transactionId: transaction.id,
      actorId: options.actorId ?? values.memberId ?? null,
      action: "create",
      payload: {
        after: serializeTransactionForPayload(transaction),
      },
    });

    return { transaction, walletSummary };
  });

  const [enriched] = await attachLatestActivities(accountId, [
    {
      ...result.transaction,
      wallet: result.walletSummary ?? null,
    },
  ]);
  return enriched ?? result.transaction;
}

export async function updateTransaction(
  accountSlug: string,
  transactionId: string,
  values: {
    walletId?: string | null;
    memberId?: string | null;
    type?: "income" | "expense";
    title?: string;
    category?: string;
    amount?: number;
    occurredAt?: Date;
    description?: string | null;
  },
  options: TransactionActorOptions = {},
) {
  const accountId = await requireAccountId(accountSlug);
  const result = await db.transaction(async (tx) => {
    const existing = await tx.query.transactions.findFirst({
      where: and(eq(transactions.id, transactionId), eq(transactions.accountId, accountId)),
    });

    if (!existing) {
      return { transaction: null, walletSummary: null } as const;
    }

    const previousAmount = normalizeAmount(parseNumeric(existing.amount));
    const previousDelta = existing.type === "income" ? previousAmount : -previousAmount;
    const previousWalletId = existing.walletId ?? null;

    const nextType = values.type ?? existing.type;
    const nextAmount = values.amount !== undefined ? normalizeAmount(values.amount) : previousAmount;
    const nextWalletId = values.walletId !== undefined ? values.walletId ?? null : previousWalletId;
    const nextDescription = values.description !== undefined ? values.description : existing.description;

    const nextDelta = nextType === "income" ? nextAmount : -nextAmount;

    let walletSummary: WalletSummary | null | undefined;

    if (previousWalletId && nextWalletId && previousWalletId === nextWalletId) {
      const deltaDifference = normalizeAmount(nextDelta - previousDelta);
      if (deltaDifference !== 0) {
        walletSummary = await applyWalletDelta(tx, accountId, previousWalletId, deltaDifference);
      } else {
        walletSummary = await getWalletSummaryForAccount(accountId, previousWalletId, tx);
      }
    } else {
      if (previousWalletId) {
        await applyWalletDelta(tx, accountId, previousWalletId, -previousDelta);
      }

      if (nextWalletId) {
        walletSummary = await applyWalletDelta(tx, accountId, nextWalletId, nextDelta);
      } else {
        walletSummary = null;
      }
    }

    const [transaction] = await tx
      .update(transactions)
      .set({
        walletId: values.walletId !== undefined ? values.walletId : undefined,
        memberId: values.memberId !== undefined ? values.memberId : undefined,
        type: values.type,
        title: values.title,
        category: values.category,
        amount: values.amount !== undefined ? toNumericString(nextAmount) : undefined,
        occurredAt: values.occurredAt,
        description: nextDescription,
        updatedAt: new Date(),
      })
      .where(and(eq(transactions.id, transactionId), eq(transactions.accountId, accountId)))
      .returning();

    if (!transaction) {
      return { transaction: null, walletSummary: null } as const;
    }

    await logTransactionActivity(tx, {
      accountId,
      transactionId,
      actorId: options.actorId ?? values.memberId ?? existing.memberId ?? null,
      action: "update",
      payload: {
        before: serializeTransactionForPayload(existing),
        after: serializeTransactionForPayload(transaction),
      },
    });

    if (transaction.walletId && walletSummary === undefined) {
      walletSummary = await getWalletSummaryForAccount(accountId, transaction.walletId, tx);
    }

    return { transaction, walletSummary } as const;
  });

  if (!result.transaction) {
    return null;
  }

  const [enriched] = await attachLatestActivities(accountId, [
    {
      ...result.transaction,
      wallet: result.walletSummary ?? null,
    },
  ]);
  return enriched ?? result.transaction;
}

export async function deleteTransaction(accountSlug: string, transactionId: string, options: TransactionActorOptions = {}) {
  const accountId = await requireAccountId(accountSlug);

  return db.transaction(async (tx) => {
    const existing = await tx.query.transactions.findFirst({
      where: and(eq(transactions.id, transactionId), eq(transactions.accountId, accountId)),
    });

    if (!existing) {
      return false;
    }

    const deleted = await tx
      .delete(transactions)
      .where(and(eq(transactions.id, transactionId), eq(transactions.accountId, accountId)))
      .returning();

    if (deleted.length === 0) {
      return false;
    }

    if (existing.walletId) {
      const amount = normalizeAmount(parseNumeric(existing.amount));
      const delta = existing.type === "income" ? amount : -amount;
      await applyWalletDelta(tx, accountId, existing.walletId, -delta);
    }

    await logTransactionActivity(tx, {
      accountId,
      transactionId,
      actorId: options.actorId ?? existing.memberId ?? null,
      action: "delete",
      payload: {
        before: serializeTransactionForPayload(existing),
      },
    });

    return true;
  });
}

export async function setDefaultAccountForMember(memberId: string, accountId: string) {
  await db.transaction(async (tx) => {
    const membership = await tx.query.accountMembers.findFirst({
      where: and(eq(accountMembers.accountId, accountId), eq(accountMembers.memberId, memberId)),
    });

    if (!membership) {
      throw new Error("Membership not found for default update");
    }

    const now = new Date();

    await tx
      .update(accountMembers)
      .set({ isDefault: false, updatedAt: now })
      .where(eq(accountMembers.memberId, memberId));

    await tx
      .update(accountMembers)
      .set({ isDefault: true, updatedAt: now })
      .where(eq(accountMembers.id, membership.id));
  });
}

export interface DefaultAccountMembership {
  accountId: string;
  accountSlug: string;
  accountName: string;
  membershipId: string;
  memberId: string;
  role: "owner" | "member";
  isOwner: boolean;
  isDefault: boolean;
  updatedAt: Date;
}

export async function getDefaultAccountForMember(
  memberId: string,
  email?: string | null
): Promise<DefaultAccountMembership | null> {
  const memberIds = new Set<string>([memberId]);

  if (email) {
    const matchingMembers = await db.query.members.findMany({
      where: eq(members.email, email),
      columns: {
        id: true,
      },
    });

    for (const matching of matchingMembers) {
      if (matching.id) {
        memberIds.add(matching.id);
      }
    }
  }

  const ids = Array.from(memberIds).filter(Boolean);
  if (ids.length === 0) {
    return null;
  }

  const [defaultMembership] = await db.query.accountMembers.findMany({
    where: and(inArray(accountMembers.memberId, ids), eq(accountMembers.isDefault, true)),
    with: {
      account: true,
    },
    orderBy: (fields, operators) => operators.desc(fields.updatedAt),
    limit: 1,
  });

  const membershipCandidate = defaultMembership
    ? defaultMembership
    : (
        await db.query.accountMembers.findMany({
          where: inArray(accountMembers.memberId, ids),
          with: {
            account: true,
          },
          orderBy: (fields, operators) => operators.desc(fields.updatedAt),
          limit: 1,
        })
      )[0];

  if (!membershipCandidate || !membershipCandidate.account) {
    return null;
  }

  return {
    accountId: membershipCandidate.accountId,
    accountSlug: membershipCandidate.account.slug,
    accountName: membershipCandidate.account.name ?? "Kas Tanpa Nama",
    membershipId: membershipCandidate.id,
    memberId: membershipCandidate.memberId,
    role: membershipCandidate.role,
    isOwner: membershipCandidate.role === "owner",
    isDefault: Boolean(membershipCandidate.isDefault),
    updatedAt: membershipCandidate.updatedAt,
  };
}

export async function getBudgets(accountSlug: string) {
  const accountId = await requireAccountId(accountSlug);
  return db.query.budgets.findMany({
    where: eq(budgets.accountId, accountId),
    orderBy: (fields, operators) => operators.desc(fields.createdAt),
  });
}

export async function createBudget(
  accountSlug: string,
  values: {
    category: string;
    amount: number;
    period?: "weekly" | "monthly" | "quarterly" | "yearly";
    startDate: Date;
    endDate?: Date | null;
  }
) {
  const accountId = await requireAccountId(accountSlug);
  const [budget] = await db
    .insert(budgets)
    .values({
      accountId,
      category: values.category,
      amount: values.amount.toString(),
      period: values.period ?? "monthly",
      startDate: values.startDate.toISOString().split("T")[0],
      endDate: values.endDate ? values.endDate.toISOString().split("T")[0] : null,
    })
    .returning();

  return budget;
}

export async function updateBudget(
  accountSlug: string,
  budgetId: string,
  values: {
    category?: string;
    amount?: number;
    period?: "weekly" | "monthly" | "quarterly" | "yearly";
    startDate?: Date;
    endDate?: Date | null;
    status?: "on-track" | "warning" | "over-budget";
    spentAmount?: number;
  }
) {
  const accountId = await requireAccountId(accountSlug);
  const [budget] = await db
    .update(budgets)
    .set({
      category: values.category,
      amount: values.amount !== undefined ? values.amount.toString() : undefined,
      period: values.period,
      startDate: values.startDate ? values.startDate.toISOString().split("T")[0] : undefined,
      endDate: values.endDate ? values.endDate.toISOString().split("T")[0] : values.endDate === null ? null : undefined,
      status: values.status,
      spentAmount: values.spentAmount !== undefined ? values.spentAmount.toString() : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(budgets.id, budgetId), eq(budgets.accountId, accountId)))
    .returning();

  return budget ?? null;
}

export async function deleteBudget(accountSlug: string, budgetId: string) {
  const accountId = await requireAccountId(accountSlug);
  const deleted = await db
    .delete(budgets)
    .where(and(eq(budgets.id, budgetId), eq(budgets.accountId, accountId)))
    .returning();

  return deleted.length > 0;
}

export async function getWallets(accountSlug: string) {
  const accountId = await requireAccountId(accountSlug);
  return db.query.wallets.findMany({
    where: eq(wallets.accountId, accountId),
    orderBy: (fields, operators) => operators.asc(fields.createdAt),
  });
}

export async function createWallet(
  accountSlug: string,
  values: {
    name: string;
    type: "bank" | "e_wallet" | "credit_card" | "cash";
    provider?: string | null;
    accountNumber?: string | null;
    color?: string | null;
    balance?: number;
  }
) {
  const accountId = await requireAccountId(accountSlug);
  const [wallet] = await db
    .insert(wallets)
    .values({
      accountId,
      name: values.name,
      type: values.type,
      provider: values.provider ?? null,
      accountNumber: values.accountNumber ?? null,
      color: values.color ?? null,
      balance: toNumericString(values.balance ?? 0),
    })
    .returning();

  return wallet;
}

export async function updateWallet(
  accountSlug: string,
  walletId: string,
  values: {
    name?: string;
    type?: "bank" | "e_wallet" | "credit_card" | "cash";
    provider?: string | null;
    accountNumber?: string | null;
    color?: string | null;
    balance?: number;
  }
) {
  const accountId = await requireAccountId(accountSlug);
  const [wallet] = await db
    .update(wallets)
    .set({
      name: values.name,
      type: values.type,
      provider: values.provider ?? undefined,
      accountNumber: values.accountNumber ?? undefined,
      color: values.color ?? undefined,
      balance: values.balance !== undefined ? toNumericString(values.balance) : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(wallets.id, walletId), eq(wallets.accountId, accountId)))
    .returning();

  return wallet ?? null;
}

export async function deleteWallet(accountSlug: string, walletId: string) {
  const accountId = await requireAccountId(accountSlug);
  const deleted = await db
    .delete(wallets)
    .where(and(eq(wallets.id, walletId), eq(wallets.accountId, accountId)))
    .returning();

  return deleted.length > 0;
}

export async function adjustWalletBalance(accountSlug: string, walletId: string, delta: number) {
  if (!Number.isFinite(delta)) {
    throw new Error("Invalid amount");
  }

  return db.transaction(async (tx) => {
    const accountId = await requireAccountId(accountSlug);
    const wallet = await tx.query.wallets.findFirst({
      where: and(eq(wallets.id, walletId), eq(wallets.accountId, accountId)),
    });

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const currentBalance = parseNumeric(wallet.balance);
    const nextBalance = normalizeAmount(currentBalance + delta);

    if (nextBalance < 0) {
      throw new Error("Insufficient balance");
    }

    const [updated] = await tx
      .update(wallets)
      .set({
        balance: toNumericString(nextBalance),
        updatedAt: new Date(),
      })
      .where(and(eq(wallets.id, walletId), eq(wallets.accountId, accountId)))
      .returning();

    if (!updated) {
      throw new Error("Wallet not found");
    }

    return updated;
  });
}

export async function transferBetweenWallets(
  accountSlug: string,
  sourceWalletId: string,
  targetWalletId: string,
  amount: number,
  options?: {
    note?: string;
    memberId?: string;
    occurredAt?: Date;
  }
) {
  if (sourceWalletId === targetWalletId) {
    throw new Error("Wallets must be different");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Invalid amount");
  }

  const normalizedAmount = normalizeAmount(amount);
  const occurredAt = options?.occurredAt ?? new Date();

  return db.transaction(async (tx) => {
    const accountId = await requireAccountId(accountSlug);
    const [source, target] = await Promise.all([
      tx.query.wallets.findFirst({
        where: and(eq(wallets.id, sourceWalletId), eq(wallets.accountId, accountId)),
      }),
      tx.query.wallets.findFirst({
        where: and(eq(wallets.id, targetWalletId), eq(wallets.accountId, accountId)),
      }),
    ]);

    if (!source || !target) {
      throw new Error("Wallet not found");
    }

    const sourceBalance = parseNumeric(source.balance);
    const targetBalance = parseNumeric(target.balance);

    if (sourceBalance < normalizedAmount) {
      throw new Error("Insufficient balance");
    }

    const nextSourceBalance = normalizeAmount(sourceBalance - normalizedAmount);
    const nextTargetBalance = normalizeAmount(targetBalance + normalizedAmount);

    const [updatedSource] = await tx
      .update(wallets)
      .set({
        balance: toNumericString(nextSourceBalance),
        updatedAt: new Date(),
      })
      .where(and(eq(wallets.id, sourceWalletId), eq(wallets.accountId, accountId)))
      .returning();

    const [updatedTarget] = await tx
      .update(wallets)
      .set({
        balance: toNumericString(nextTargetBalance),
        updatedAt: new Date(),
      })
      .where(and(eq(wallets.id, targetWalletId), eq(wallets.accountId, accountId)))
      .returning();

    if (!updatedSource || !updatedTarget) {
      throw new Error("Wallet not found");
    }

    const description = options?.note ?? undefined;

    const [expenseTransaction] = await tx
      .insert(transactions)
      .values({
        accountId,
        walletId: sourceWalletId,
        memberId: options?.memberId ?? null,
        type: "expense",
        title: `Transfer ke ${target.name}`,
        category: "Transfer",
        amount: toNumericString(normalizedAmount),
        occurredAt,
        description,
      })
      .returning();

    const [incomeTransaction] = await tx
      .insert(transactions)
      .values({
        accountId,
        walletId: targetWalletId,
        memberId: options?.memberId ?? null,
        type: "income",
        title: `Transfer dari ${source.name}`,
        category: "Transfer",
        amount: toNumericString(normalizedAmount),
        occurredAt,
        description,
      })
      .returning();

    return {
      source: updatedSource,
      target: updatedTarget,
      expenseTransaction,
      incomeTransaction,
    };
  });
}

export async function getInstallments(accountSlug: string) {
  const accountId = await requireAccountId(accountSlug);
  return db.query.installments.findMany({
    where: eq(installments.accountId, accountId),
    orderBy: (fields, operators) => operators.asc(fields.dueDate),
  });
}

export async function createInstallment(
  accountSlug: string,
  values: {
    name: string;
    type: string;
    provider?: string | null;
    monthlyAmount: number;
    remainingAmount: number;
    remainingPayments?: number | null;
    dueDate: Date;
    status?: "upcoming" | "overdue" | "paid";
  }
) {
  const accountId = await requireAccountId(accountSlug);
  const [installment] = await db
    .insert(installments)
    .values({
      accountId,
      name: values.name,
      type: values.type,
      provider: values.provider ?? null,
      monthlyAmount: values.monthlyAmount.toString(),
      remainingAmount: values.remainingAmount.toString(),
      remainingPayments: values.remainingPayments ?? null,
      dueDate: values.dueDate.toISOString().split("T")[0],
      status: values.status ?? "upcoming",
    })
    .returning();

  return installment;
}

export async function updateInstallment(
  accountSlug: string,
  installmentId: string,
  values: {
    name?: string;
    type?: string;
    provider?: string | null;
    monthlyAmount?: number;
    remainingAmount?: number;
    remainingPayments?: number | null;
    dueDate?: Date;
    status?: "upcoming" | "overdue" | "paid";
  }
) {
  const accountId = await requireAccountId(accountSlug);
  const [installment] = await db
    .update(installments)
    .set({
      name: values.name,
      type: values.type,
      provider: values.provider,
      monthlyAmount: values.monthlyAmount !== undefined ? values.monthlyAmount.toString() : undefined,
      remainingAmount: values.remainingAmount !== undefined ? values.remainingAmount.toString() : undefined,
      remainingPayments: values.remainingPayments ?? undefined,
      dueDate: values.dueDate ? values.dueDate.toISOString().split("T")[0] : undefined,
      status: values.status,
      updatedAt: new Date(),
    })
    .where(and(eq(installments.id, installmentId), eq(installments.accountId, accountId)))
    .returning();

  return installment ?? null;
}

export async function deleteInstallment(accountSlug: string, installmentId: string) {
  const accountId = await requireAccountId(accountSlug);
  const deleted = await db
    .delete(installments)
    .where(and(eq(installments.id, installmentId), eq(installments.accountId, accountId)))
    .returning();

  return deleted.length > 0;
}
