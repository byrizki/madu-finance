import { NextResponse } from "next/server";

import { getAccountsForMember } from "@/lib/db/queries";
import { requireSessionFromRequest } from "@/lib/auth/guard";

export async function GET(request: Request) {
  try {
    const result = await requireSessionFromRequest(request);
    if ("response" in result) {
      return result.response;
    }

    const {
      context: {
        user,
      },
    } = result;

    const accounts = await getAccountsForMember(user.id, user.email ?? null);

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Failed to fetch accounts for member", error);
    return NextResponse.json({ error: "Failed to load accounts" }, { status: 500 });
  }
}
