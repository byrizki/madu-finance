import { NextResponse } from "next/server";

import { removeMember, updateMember } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ account: string; memberId: string }> }
) {
  try {
    const { memberId } = await params;

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const resolved = await authorizeAccountAccess({ request, params, requireOwner: true });

    if ("response" in resolved) {
      return resolved.response;
    }

    const success = await removeMember(resolved.context.account.slug, memberId);

    if (!success) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove member", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ account: string; memberId: string }> }
) {
  try {
    const { memberId } = await params;

    if (!memberId) {
      return NextResponse.json({ error: "memberId is required" }, { status: 400 });
    }

    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const accountSlug = resolved.context.account.slug;
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      avatarUrl?: string | null;
      phone?: string | null;
      address?: string | null;
    };

    const member = await updateMember(accountSlug, memberId, body ?? {});

    if (!member) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ member }, { status: 200 });
  } catch (error) {
    console.error("Failed to update member", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
