import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { requireSessionFromRequest } from "@/lib/auth/guard";

export async function POST(request: Request) {
  const result = await requireSessionFromRequest(request);
  if ("response" in result) {
    return result.response;
  }

  try {
    const { newPassword } = (await request.json().catch(() => ({}))) as {
      newPassword?: string;
    };

    if (!newPassword) {
      return NextResponse.json({ error: "newPassword is required" }, { status: 400 });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    await auth.api.setPassword({
      body: {
        newPassword,
      },
      headers: request.headers,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update password", error);
    const message = error instanceof Error ? error.message : "Failed to update password";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
