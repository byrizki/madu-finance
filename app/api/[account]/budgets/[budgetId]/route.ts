import { NextResponse } from "next/server";

import { deleteBudget, updateBudget } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ account: string; budgetId: string }> }
) {
  try {
    const { budgetId } = await params;

    if (!budgetId) {
      return NextResponse.json({ error: "budgetId is required" }, { status: 400 });
    }

    const resolved = await authorizeAccountAccess({ request, params, requireOwner: true });

    if ("response" in resolved) {
      return resolved.response;
    }

    const accountSlug = resolved.context.account.slug;
    const body = await request.json();
    const { category, amount, period, startDate, endDate, status, spentAmount } = body ?? {};

    const updated = await updateBudget(accountSlug, budgetId, {
      category,
      amount: amount !== undefined ? Number(amount) : undefined,
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate === null ? null : endDate ? new Date(endDate) : undefined,
      status,
      spentAmount: spentAmount !== undefined ? Number(spentAmount) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ budget: updated });
  } catch (error) {
    console.error("Failed to update budget", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ account: string; budgetId: string }> }
) {
  try {
    const { budgetId } = await params;

    if (!budgetId) {
      return NextResponse.json({ error: "budgetId is required" }, { status: 400 });
    }

    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const success = await deleteBudget(resolved.context.account.slug, budgetId);

    if (!success) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete budget", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
