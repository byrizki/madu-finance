import { NextResponse } from "next/server";

import { createTransaction, getTransactions } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function GET(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const rows = await getTransactions(resolved.context.account.slug);
    return NextResponse.json({ transactions: rows });
  } catch (error) {
    console.error("Failed to fetch transactions", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const accountSlug = resolved.context.account.slug;
    const body = await request.json();
    const { walletId, memberId, type, title, category, amount, occurredAt, description } = body ?? {};

    const normalizedWalletId =
      walletId === null
        ? null
        : typeof walletId === "string" && walletId.trim().length > 0
          ? walletId.trim()
          : undefined;
    const normalizedMemberId =
      memberId === null
        ? null
        : typeof memberId === "string" && memberId.trim().length > 0
          ? memberId.trim()
          : undefined;

    if (!type || !title || !category || amount === undefined) {
      return NextResponse.json({ error: "type, title, category, and amount are required" }, { status: 400 });
    }

    const transaction = await createTransaction(
      accountSlug,
      {
        walletId: normalizedWalletId ?? undefined,
        memberId: normalizedMemberId ?? undefined,
        type,
        title,
        category,
        amount: Number(amount),
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        description,
      },
      { actorId: resolved.context.memberId },
    );
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error("Failed to create transaction", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Dompet tidak ditemukan" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
