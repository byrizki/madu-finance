import { NextResponse } from "next/server";

import { resolveAccountContext } from "@/lib/api/account-context";
import { createMember, getAccountMembers } from "@/lib/db/queries";
import { censorEmail } from "@/utils/censor-email";

export async function GET(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const { account: accountSlug } = await params;
    const result = await resolveAccountContext(request, accountSlug);
    if ("response" in result) {
      return result.response;
    }

    const { context } = result;
    const account = context.account;

    const members = await getAccountMembers(account.slug);

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Failed to fetch members", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const { account: accountSlug } = await params;
    const result = await resolveAccountContext(request, accountSlug, { requireOwner: true });
    if ("response" in result) {
      return result.response;
    }

    const {
      context: { account },
    } = result;

    const payload = (await request.json()) as {
      email?: string;
      name?: string;
      role?: "owner" | "member";
    };

    if (!payload?.email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const member = await createMember(account.slug, {
      email: payload.email,
      name: payload.name,
      role: payload.role,
    });

    const responsePayload = {
      ...member,
      email: censorEmail(member.email ?? payload.email ?? ""),
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (error) {
    console.error("Failed to create member", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
