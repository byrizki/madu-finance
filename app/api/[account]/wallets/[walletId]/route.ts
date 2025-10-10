import { NextResponse } from "next/server";

import { deleteWallet, updateWallet } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ account: string; walletId: string }> }
) {
  try {
    const { walletId } = await params;

    if (!walletId) {
      return NextResponse.json({ error: "walletId is required" }, { status: 400 });
    }

    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const accountSlug = resolved.context.account.slug;
    const body = await request.json();
    const { name, type, provider, accountNumber, color, balance } = body ?? {};

    const updated = await updateWallet(accountSlug, walletId, {
      name,
      type,
      provider: provider ?? null,
      accountNumber: accountNumber ?? null,
      color: color ?? null,
      balance: balance !== undefined ? Number(balance) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json({ wallet: updated });
  } catch (error) {
    console.error("Failed to update wallet", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ account: string; walletId: string }> }
) {
  try {
    const { walletId } = await params;

    if (!walletId) {
      return NextResponse.json({ error: "walletId is required" }, { status: 400 });
    }

    const resolved = await authorizeAccountAccess({ request, params, requireOwner: true });

    if ("response" in resolved) {
      return resolved.response;
    }

    const success = await deleteWallet(resolved.context.account.slug, walletId);

    if (!success) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete wallet", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
