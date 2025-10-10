import { NextResponse } from "next/server";

import { requireSessionFromRequest } from "@/lib/auth/guard";
import { findMembershipForUser, getDefaultAccountForMember, setDefaultAccountForMember } from "@/lib/db/queries";

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

    const defaultAccount = await getDefaultAccountForMember(user.id, user.email ?? null);
    const payload = defaultAccount
      ? {
          ...defaultAccount,
          updatedAt: defaultAccount.updatedAt.toISOString(),
        }
      : null;

    return NextResponse.json({ account: payload });
  } catch (error) {
    console.error("Failed to fetch default account", error);
    return NextResponse.json({ error: "Gagal memuat Kas default" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { accountSlug } = (await request.json().catch(() => ({}))) as {
      accountSlug?: string;
    };

    if (!accountSlug) {
      return NextResponse.json({ error: "Parameter accountSlug wajib diisi" }, { status: 400 });
    }

    const result = await requireSessionFromRequest(request);
    if ("response" in result) {
      return result.response;
    }

    const {
      context: {
        user,
      },
    } = result;

    const membership = await findMembershipForUser(accountSlug, user.id, user.email ?? null);

    if (!membership) {
      return NextResponse.json({ error: "Anda tidak memiliki akses ke Kas ini" }, { status: 403 });
    }

    await setDefaultAccountForMember(user.id, membership.accountId);

    return NextResponse.json({ success: true, accountSlug });
  } catch (error) {
    console.error("Failed to set default account", error);
    return NextResponse.json({ error: "Gagal mengatur Kas default. Silakan coba lagi." }, { status: 500 });
  }
}
