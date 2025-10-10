import { NextResponse } from "next/server";

import { createInstallment, getInstallments } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function GET(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const rows = await getInstallments(resolved.context.account.slug);
    return NextResponse.json({ installments: rows });
  } catch (error) {
    console.error("Failed to fetch installments", error);
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
    const { name, type, provider, monthlyAmount, remainingAmount, dueDate, status } = body ?? {};

    if (!name || !type || monthlyAmount === undefined || remainingAmount === undefined || !dueDate) {
      return NextResponse.json(
        { error: "name, type, monthlyAmount, remainingAmount, and dueDate are required" },
        { status: 400 }
      );
    }

    const installment = await createInstallment(accountSlug, {
      name,
      type,
      provider,
      monthlyAmount: Number(monthlyAmount),
      remainingAmount: Number(remainingAmount),
      dueDate: new Date(dueDate),
      status,
    });

    return NextResponse.json({ installment }, { status: 201 });
  } catch (error) {
    console.error("Failed to create installment", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
