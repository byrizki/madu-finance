import { NextResponse } from "next/server";

import { requireSessionFromRequest } from "@/lib/auth/guard";
import { findMembershipForUser, getAccountDetailsBySlug } from "@/lib/db/queries";
import type { MembershipRole, SharedAccountWithOwnerRecord } from "@/lib/db/types";

interface ResolveAccountOptions {
  requireOwner?: boolean;
}

export interface ResolvedAccountContext {
  account: SharedAccountWithOwnerRecord;
  memberId: string;
  membershipRole: MembershipRole;
}

type ResolveAccountResult = { context: ResolvedAccountContext } | { response: NextResponse };

export async function resolveAccountContext(
  request: Request,
  slug: string,
  options?: ResolveAccountOptions
): Promise<ResolveAccountResult> {
  if (!slug) {
    return { response: NextResponse.json({ error: "Account slug is required" }, { status: 400 }) };
  }

  const sessionResult = await requireSessionFromRequest(request);

  if ("response" in sessionResult) {
    return sessionResult;
  }

  const {
    context: {
      session: {
        user: { id: userId, email },
      },
    },
  } = sessionResult;

  const account = await getAccountDetailsBySlug(slug);

  if (!account) {
    return { response: NextResponse.json({ error: "Account not found" }, { status: 404 }) };
  }

  const membership = await findMembershipForUser(account.slug, userId, email ?? null);

  if (!membership) {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (options?.requireOwner && membership.role !== "owner") {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const context: ResolvedAccountContext = {
    account,
    memberId: membership.memberId,
    membershipRole: membership.role,
  };

  return { context };
}
