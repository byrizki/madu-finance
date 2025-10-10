import { NextResponse } from "next/server";

import { requireSessionFromRequest } from "@/lib/auth/guard";
import { findMembershipForUser, getAccountDetailsBySlug, updateAccountDetails } from "@/lib/db/queries";

export async function GET(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const { account: accountSlug } = await params;

    if (!accountSlug) {
      return NextResponse.json({ error: "Account slug is required" }, { status: 400 });
    }

    const result = await requireSessionFromRequest(request);
    if ("response" in result) {
      return result.response;
    }

    const {
      context: {
        user,
      },
    } = result;

    const account = await getAccountDetailsBySlug(accountSlug);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const membership = await findMembershipForUser(account.slug, user.id, user.email ?? null);

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error("Failed to fetch account details", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const { account: accountSlug } = await params;

    if (!accountSlug) {
      return NextResponse.json({ error: "Account slug is required" }, { status: 400 });
    }

    const result = await requireSessionFromRequest(request);
    if ("response" in result) {
      return result.response;
    }

    const {
      context: {
        user,
      },
    } = result;

    const account = await getAccountDetailsBySlug(accountSlug);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const membership = await findMembershipForUser(account.slug, user.id, user.email ?? null);

    if (!membership || membership.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, slug } = (await request.json().catch(() => ({}))) as {
      name?: string;
      slug?: string;
    };

    if (!name && !slug) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    const updated = await updateAccountDetails(account.slug, { name, slug });

    const nextAccount = updated ? await getAccountDetailsBySlug(updated.slug) : account;

    if (!nextAccount) {
      return NextResponse.json({ error: "Failed to retrieve updated account" }, { status: 500 });
    }

    return NextResponse.json({ account: nextAccount });
  } catch (error) {
    console.error("Failed to update account details", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
