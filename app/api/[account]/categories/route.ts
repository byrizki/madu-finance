import { NextResponse } from "next/server";

import { authorizeAccountAccess } from "@/lib/api/ownership";
import { getAccountCategorySuggestions } from "@/lib/db/queries";

export async function GET(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

    const categories = await getAccountCategorySuggestions(resolved.context.account.slug, {
      search,
      limit: Number.isNaN(limit) ? undefined : limit,
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to fetch category suggestions", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
