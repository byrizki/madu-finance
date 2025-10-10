import { NextResponse } from "next/server";

import { deleteInstallment, updateInstallment } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ account: string; installmentId: string }> }
) {
  try {
    const { installmentId } = await params;

    if (!installmentId) {
      return NextResponse.json({ error: "installmentId is required" }, { status: 400 });
    }

    const resolved = await authorizeAccountAccess({ request, params, requireOwner: true });

    if ("response" in resolved) {
      return resolved.response;
    }

    const accountSlug = resolved.context.account.slug;
    const body = await request.json();
    const { name, type, provider, monthlyAmount, remainingAmount, dueDate, status } = body ?? {};

    if (
      name === undefined &&
      type === undefined &&
      provider === undefined &&
      monthlyAmount === undefined &&
      remainingAmount === undefined &&
      dueDate === undefined &&
      status === undefined
    ) {
      return NextResponse.json({ error: "At least one field must be provided" }, { status: 400 });
    }

    const updated = await updateInstallment(accountSlug, installmentId, {
      name,
      type,
      provider,
      monthlyAmount: monthlyAmount !== undefined ? Number(monthlyAmount) : undefined,
      remainingAmount: remainingAmount !== undefined ? Number(remainingAmount) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status,
    });

    if (!updated) {
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    return NextResponse.json({ installment: updated });
  } catch (error) {
    console.error("Failed to update installment", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ account: string; installmentId: string }> }
) {
  try {
    const { installmentId } = await params;

    if (!installmentId) {
      return NextResponse.json({ error: "installmentId is required" }, { status: 400 });
    }

    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const success = await deleteInstallment(resolved.context.account.slug, installmentId);

    if (!success) {
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete installment", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
