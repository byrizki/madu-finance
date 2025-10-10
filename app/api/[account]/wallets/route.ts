import { NextResponse } from "next/server";

import { createWallet, getWallets } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function GET(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const rows = await getWallets(resolved.context.account.slug);
    return NextResponse.json({ wallets: rows });
  } catch (error) {
    console.error("Failed to fetch wallets", error);
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
    const { name, type, provider, accountNumber, color, balance } = body ?? {};

    if (!name || !type) {
      return NextResponse.json({ error: "name and type are required" }, { status: 400 });
    }

    const wallet = await createWallet(accountSlug, {
      name,
      type,
      provider,
      accountNumber,
      color,
      balance: balance !== undefined ? Number(balance) : undefined,
    });

    return NextResponse.json({ wallet }, { status: 201 });
  } catch (error) {
    console.error("Failed to create wallet", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
