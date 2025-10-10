import { and, countDistinct, eq } from "drizzle-orm";
import { Buffer } from "node:buffer";

import { db } from "./index";
import {
  accountMembers,
  budgets,
  installments,
  members,
  sharedAccounts,
  transactions,
  wallets,
} from "./schema";
import { randomSlugSuffix, slugify } from "../utils";

interface OnboardingUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  metadata?: Record<string, unknown> | null;
}

const ACCOUNT_NAME_PREFIX = "Kas ";
const DEFAULT_SLUG_SUFFIX_LENGTH = 4;

function getTodayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

const DEFAULT_WALLETS: any[] = [
  {
    name: "Dompet Utama",
    type: "cash" as const,
    balance: "0",
    color: "#6366F1",
  },
];

const DEFAULT_BUDGETS: any[] = [];

const DEFAULT_INSTALLMENTS: any[] = [];

const DEFAULT_TRANSACTIONS: any[] = [];

async function fetchAvatarAsDataUrl(url?: string): Promise<string | undefined> {
  if (!url) {
    return undefined;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("data:")) {
    return trimmed;
  }

  try {
    const response = await fetch(trimmed);
    if (!response.ok) {
      return undefined;
    }

    const contentType = response.headers.get("content-type") ?? "image/png";
    if (!contentType.startsWith("image/")) {
      return undefined;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString("base64");
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error("Failed to fetch avatar for base64 conversion", error);
    return undefined;
  }
}

const NAME_KEYS = [
  "full_name",
  "fullName",
  "fullname",
  "name",
  "display_name",
  "displayName",
  "preferred_name",
  "preferredName",
];

const GIVEN_NAME_KEYS = ["given_name", "givenName", "first_name", "firstName"];
const FAMILY_NAME_KEYS = ["family_name", "familyName", "last_name", "lastName"];

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function collectNameCandidates(record?: Record<string, unknown> | null): string[] {
  if (!record) {
    return [];
  }

  const candidates: string[] = [];

  for (const key of NAME_KEYS) {
    const candidate = toTrimmedString(record[key]);
    if (candidate) {
      candidates.push(candidate);
    }
  }

  const given = GIVEN_NAME_KEYS.map((key) => toTrimmedString(record[key])).find(Boolean) ?? null;
  const family = FAMILY_NAME_KEYS.map((key) => toTrimmedString(record[key])).find(Boolean) ?? null;

  if (given && family) {
    candidates.push(`${given} ${family}`.trim());
  }

  if (given) {
    candidates.push(given);
  }

  if (family) {
    candidates.push(family);
  }

  return candidates;
}

function deriveMemberName(user: OnboardingUser, emailFallback: string): string {
  const fallbackUsername = emailFallback.split("@")[0]?.trim() ?? "";
  const fallbackLower = fallbackUsername.toLowerCase();

  const candidates: string[] = [];

  if (user.name) {
    candidates.push(user.name);
  }

  const metadata = (user.metadata ?? null) as Record<string, unknown> | null;
  candidates.push(...collectNameCandidates(metadata));

  const metadataIdentities = Array.isArray((metadata as Record<string, unknown> | null)?.identities)
    ? ((metadata?.identities as unknown[]) ?? [])
    : [];

  for (const identity of metadataIdentities) {
    if (identity && typeof identity === "object") {
      candidates.push(...collectNameCandidates(identity as Record<string, unknown>));
    }
  }

  const seen = new Set<string>();
  for (const candidate of candidates) {
    const normalized = candidate.trim();
    if (!normalized) {
      continue;
    }

    const lower = normalized.toLowerCase();
    if (seen.has(lower)) {
      continue;
    }

    seen.add(lower);

    if (lower === fallbackLower || lower === "pengguna") {
      continue;
    }

    return normalized;
  }

  if (fallbackUsername) {
    return fallbackUsername;
  }

  return "Pengguna";
}

export async function initializeDefaultAccount(user: OnboardingUser) {
  const metadata = (user.metadata ?? null) as Record<string, unknown> | null;
  const avatarUrl =
    (metadata?.avatar_url as string | undefined) ??
    (metadata?.picture as string | undefined) ??
    user.image ?? undefined;

  const memberEmail = user.email?.trim() || `${user.id}@example.com`;
  const memberName = deriveMemberName(user, memberEmail);

  const normalizedAvatar = avatarUrl?.trim() || undefined;
  const avatarDataUrl = await fetchAvatarAsDataUrl(normalizedAvatar);
  const resolvedAvatar = avatarDataUrl ?? normalizedAvatar;

  const existingAccount = await db.query.sharedAccounts.findFirst({
    where: eq(sharedAccounts.ownerId, user.id),
  });

  if (existingAccount) {
    await ensureMemberProfileFilled(user.id, memberEmail, memberName, resolvedAvatar);

    const now = new Date();
    await db
      .update(accountMembers)
      .set({ isDefault: false, updatedAt: now })
      .where(eq(accountMembers.memberId, user.id));
    await db
      .update(accountMembers)
      .set({ isDefault: true, updatedAt: now })
      .where(and(eq(accountMembers.accountId, existingAccount.id), eq(accountMembers.memberId, user.id)));

    const [counts] = await db
      .select({
        walletCount: countDistinct(wallets.id).as("walletCount"),
        budgetCount: countDistinct(budgets.id).as("budgetCount"),
        transactionCount: countDistinct(transactions.id).as("transactionCount"),
        installmentCount: countDistinct(installments.id).as("installmentCount"),
      })
      .from(sharedAccounts)
      .leftJoin(wallets, eq(wallets.accountId, sharedAccounts.id))
      .leftJoin(budgets, eq(budgets.accountId, sharedAccounts.id))
      .leftJoin(transactions, eq(transactions.accountId, sharedAccounts.id))
      .leftJoin(installments, eq(installments.accountId, sharedAccounts.id))
      .where(eq(sharedAccounts.id, existingAccount.id))
      .groupBy(sharedAccounts.id);

    const walletCount = Number(counts?.walletCount ?? 0);
    const budgetCount = Number(counts?.budgetCount ?? 0);
    const transactionCount = Number(counts?.transactionCount ?? 0);
    const installmentCount = Number(counts?.installmentCount ?? 0);

    const hasData = walletCount > 0 || budgetCount > 0 || transactionCount > 0 || installmentCount > 0;

    return { created: false, accountId: existingAccount.id, accountSlug: existingAccount.slug, hasData };
  }

  const { accountId: createdAccountId, accountSlug: createdAccountSlug, hasSeedData } = await db.transaction(async (tx) => {
    const now = new Date();

    const [upsertedMember] = await tx
      .insert(members)
      .values({
        id: user.id,
        email: memberEmail,
        name: memberName,
        avatarUrl: resolvedAvatar,
      })
      .onConflictDoUpdate({
        target: members.email,
        set: {
          id: user.id,
          email: memberEmail,
          updatedAt: now,
        },
      })
      .returning();

    if (!upsertedMember) {
      throw new Error("Failed to resolve member");
    }

    let member = upsertedMember;

    const profileUpdates: Partial<typeof members.$inferInsert> = {};

    const fallbackUsername = memberEmail.split("@")[0]?.trim()?.toLowerCase() ?? "";
    const currentName = member.name?.trim() ?? "";
    const derivedName = memberName.trim();
    const isCurrentFallback = !currentName || currentName.toLowerCase() === fallbackUsername || currentName.toLowerCase() === "pengguna";
    const isDerivedFallback = !derivedName || derivedName.toLowerCase() === fallbackUsername || derivedName.toLowerCase() === "pengguna";

    if (isCurrentFallback && !isDerivedFallback) {
      profileUpdates.name = memberName;
    }

    if (member.email !== memberEmail) {
      profileUpdates.email = memberEmail;
    }

    if (resolvedAvatar && member.avatarUrl !== resolvedAvatar) {
      profileUpdates.avatarUrl = resolvedAvatar;
    }

    if (Object.keys(profileUpdates).length > 0) {
      profileUpdates.updatedAt = now;
      const [updatedMember] = await tx.update(members).set(profileUpdates).where(eq(members.id, user.id)).returning();

      member = updatedMember ?? member;
    }

    const emailUsername = memberEmail.split("@")[0] ?? memberEmail;
    const slugBase = slugify(emailUsername) || "Kas";
    const slug = `${slugBase}-${randomSlugSuffix(DEFAULT_SLUG_SUFFIX_LENGTH)}`;
    const accountName = `${ACCOUNT_NAME_PREFIX}${memberName.split(' ').at(0)}`.trim();

    const [account] = await tx
      .insert(sharedAccounts)
      .values({
        ownerId: member.id,
        name: accountName,
        slug,
      })
      .returning();

    if (!account) {
      throw new Error("Failed to create default account");
    }

    await tx
      .update(accountMembers)
      .set({ isDefault: false, updatedAt: now })
      .where(eq(accountMembers.memberId, member.id));

    await tx.insert(accountMembers).values({
      accountId: account.id,
      memberId: member.id,
      role: "owner",
      isDefault: true,
    });

    const today = getTodayIsoDate();

    if (DEFAULT_WALLETS.length > 0) {
      await tx.insert(wallets).values(
        DEFAULT_WALLETS.map((wallet) => ({
          accountId: account.id,
          ...wallet,
        }))
      );
    }

    if (DEFAULT_BUDGETS.length > 0) {
      await tx.insert(budgets).values(
        DEFAULT_BUDGETS.map((budget) => ({
          accountId: account.id,
          ...budget,
          startDate: today,
          spentAmount: budget.status === "warning" ? "500000" : "0",
        }))
      );
    }

    if (DEFAULT_INSTALLMENTS.length > 0) {
      await tx.insert(installments).values(
        DEFAULT_INSTALLMENTS.map((installment) => ({
          accountId: account.id,
          ...installment,
          dueDate: today,
        }))
      );
    }

    if (DEFAULT_TRANSACTIONS.length > 0) {
      await tx.insert(transactions).values(
        DEFAULT_TRANSACTIONS.map((transaction, index) => ({
          accountId: account.id,
          ...transaction,
          amount: transaction.amount,
          occurredAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
        }))
      );
    }

    const hasSeedData = Boolean(
      DEFAULT_WALLETS.length || DEFAULT_BUDGETS.length || DEFAULT_INSTALLMENTS.length || DEFAULT_TRANSACTIONS.length
    );

    return { accountId: account.id, accountSlug: account.slug, hasSeedData };
  });

  return { created: true, accountId: createdAccountId, accountSlug: createdAccountSlug, hasData: hasSeedData };
}

async function ensureMemberProfileFilled(userId: string, email: string, name: string, avatar?: string) {
  await db.transaction(async (tx) => {
    const now = new Date();

    const [upsertedMember] = await tx
      .insert(members)
      .values({
        id: userId,
        email,
        name,
        avatarUrl: avatar,
      })
      .onConflictDoUpdate({
        target: members.email,
        set: {
          id: userId,
          email,
          updatedAt: now,
        },
      })
      .returning();

    if (!upsertedMember) {
      return;
    }

    const updates: Partial<typeof members.$inferInsert> = {};

    const fallbackUsername = email.split("@")[0]?.trim()?.toLowerCase() ?? "";
    const currentName = upsertedMember.name?.trim() ?? "";
    const desiredName = name.trim();
    const isCurrentFallback = !currentName || currentName.toLowerCase() === fallbackUsername || currentName.toLowerCase() === "pengguna";
    const isDesiredFallback = !desiredName || desiredName.toLowerCase() === fallbackUsername || desiredName.toLowerCase() === "pengguna";

    if (isCurrentFallback && !isDesiredFallback) {
      updates.name = name;
    }

    if (avatar && upsertedMember.avatarUrl !== avatar) {
      updates.avatarUrl = avatar;
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = now;
      await tx.update(members).set(updates).where(eq(members.id, userId));
    }
  });
}
