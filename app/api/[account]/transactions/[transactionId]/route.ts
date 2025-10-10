import { NextResponse } from "next/server";

import { deleteTransaction, updateTransaction } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ account: string; transactionId: string }> }
) {
  try {
    const { transactionId } = await params;

    if (!transactionId) {
      return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
    }

    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const accountSlug = resolved.context.account.slug;
    const body = await request.json();
    const { walletId, memberId, type, title, category, amount, occurredAt, description } = body ?? {};

    const updated = await updateTransaction(
      accountSlug,
      transactionId,
      {
        walletId,
        memberId,
        type,
        title,
        category,
        amount: amount !== undefined ? Number(amount) : undefined,
        occurredAt: occurredAt ? new Date(occurredAt) : undefined,
        description,
      },
      { actorId: resolved.context.memberId },
    );

    if (!updated) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ transaction: updated });
  } catch (error) {
    console.error("Failed to update transaction", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ account: string; transactionId: string }> }
) {
  try {
    const { transactionId } = await params;

    if (!transactionId) {
      return NextResponse.json({ error: "transactionId is required" }, { status: 400 });
    }

    const resolved = await authorizeAccountAccess({ request, params, requireOwner: true });

    if ("response" in resolved) {
      return resolved.response;
    }

    const success = await deleteTransaction(resolved.context.account.slug, transactionId, {
      actorId: resolved.context.memberId,
    });

    if (!success) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete transaction", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
