import { NextResponse } from "next/server";

import { adjustWalletBalance, createTransaction } from "@/lib/db/queries";

export async function POST(request: Request, { params }: { params: Promise<{ account: string; walletId: string }> }) {
  const { account, walletId } = await params;

  if (!account || !walletId) {
    return NextResponse.json({ error: "account and walletId are required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { action, amount, note } = body ?? {};

    if (action !== "increase" && action !== "decrease") {
      return NextResponse.json({ error: "action must be either increase or decrease" }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "amount must be greater than zero" }, { status: 400 });
    }

    const delta = action === "increase" ? parsedAmount : -parsedAmount;

    const wallet = await adjustWalletBalance(account, walletId, delta);

    await createTransaction(account, {
      walletId,
      type: action === "increase" ? "income" : "expense",
      title: action === "increase" ? "Penambahan saldo" : "Pengurangan saldo",
      category: "Penyesuaian",
      amount: parsedAmount,
      occurredAt: new Date(),
      description: note ?? undefined,
    });

    return NextResponse.json({ wallet });
  } catch (error) {
    console.error("Failed to adjust wallet balance", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status = message === "Insufficient balance" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
