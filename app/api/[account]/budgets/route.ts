import { NextResponse } from "next/server";

import { createBudget, getBudgets } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function GET(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const rows = await getBudgets(resolved.context.account.slug);
    return NextResponse.json({ budgets: rows });
  } catch (error) {
    console.error("Failed to fetch budgets", error);
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
    const { category, amount, period, startDate, endDate } = body ?? {};

    if (!category || amount === undefined || !startDate) {
      return NextResponse.json({ error: "category, amount, and startDate are required" }, { status: 400 });
    }

    const budget = await createBudget(accountSlug, {
      category,
      amount: Number(amount),
      period,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    console.error("Failed to create budget", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
