import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function GET(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const summary = await getDashboardSummary(resolved.context.account.slug);

    if (!summary) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Failed to fetch account overview", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
