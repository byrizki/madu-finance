import { NextResponse } from "next/server";

import { requireSessionFromRequest } from "@/lib/auth/guard";
import { isAccountSlugAvailable } from "@/lib/db/queries";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const excludeSlug = searchParams.get("excludeSlug");

    if (!slug) {
      return NextResponse.json({ error: "Parameter slug wajib diisi" }, { status: 400 });
    }

    const result = await requireSessionFromRequest(request);
    if ("response" in result) {
      return result.response;
    }

    const available = await isAccountSlugAvailable(slug, {
      excludeSlug: excludeSlug ?? undefined,
    });

    return NextResponse.json({ available });
  } catch (error) {
    console.error("Failed to check account slug availability", error);
    return NextResponse.json({ error: "Tidak dapat memeriksa ketersediaan slug saat ini." }, { status: 500 });
  }
}
