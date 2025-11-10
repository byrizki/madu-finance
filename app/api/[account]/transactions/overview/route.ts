import { NextResponse } from "next/server";
import { getTransactionOverview } from "@/lib/db/queries";
import { authorizeAccountAccess } from "@/lib/api/ownership";

export async function GET(request: Request, { params }: { params: Promise<{ account: string }> }) {
  try {
    const resolved = await authorizeAccountAccess({ request, params });

    if ("response" in resolved) {
      return resolved.response;
    }

    const overview = await getTransactionOverview(resolved.context.account.slug);

    return NextResponse.json(overview);
  } catch (error) {
    console.error("Failed to fetch transaction overview", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
