import { NextResponse } from "next/server";

import { initializeDefaultAccount } from "@/lib/db/onboarding";
import { requireSessionFromRequest } from "@/lib/auth/guard";

export async function POST(request: Request) {
  const result = await requireSessionFromRequest(request);
  if ("response" in result) {
    return result.response;
  }

  const {
    context: {
      user,
    },
  } = result;

  try {
    const { created, accountId, accountSlug } = await initializeDefaultAccount({
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      image: user.image ?? null,
      metadata: (user as { metadata?: Record<string, unknown> | null }).metadata ?? null,
    });

    return NextResponse.json({ created, accountId, accountSlug });
  } catch (error) {
    console.error("Failed to initialize default account", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
