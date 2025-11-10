import { NextResponse } from "next/server";
import { getTransactionOverview } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function GET(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const url = new URL(request.url);
    const monthsParam = url.searchParams.get("months");
    const months = monthsParam ? parseInt(monthsParam, 10) : 6;

    const overview = await getTransactionOverview(resolved.context.account.slug, months);

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Failed to fetch transaction overview", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
