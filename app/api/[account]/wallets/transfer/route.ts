import { NextResponse } from "next/server";

import { transferBetweenWallets } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function POST(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const resolved = await authorizeAccountAccess({ request, params, requireOwner: true });

    if ("response" in resolved) {
      return resolved.response;
    }

    const accountSlug = resolved.context.account.slug;
    const body = await request.json();
    const { sourceWalletId, targetWalletId, amount, note, memberId } = body ?? {};

    if (!sourceWalletId || !targetWalletId) {
      return NextResponse.json({ error: "sourceWalletId and targetWalletId are required" }, { status: 400 });
    }

    const parsedAmount = Number(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "amount must be greater than zero" }, { status: 400 });
    }

    const transferResult = await transferBetweenWallets(accountSlug, sourceWalletId, targetWalletId, parsedAmount, {
      note: typeof note === "string" && note.trim() ? note.trim() : undefined,
      memberId: typeof memberId === "string" ? memberId : undefined,
    });

    return NextResponse.json({ transfer: transferResult });
  } catch (error) {
    console.error("Failed to transfer between wallets", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Insufficient balance" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
