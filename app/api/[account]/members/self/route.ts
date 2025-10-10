import { NextResponse } from "next/server";

import { resolveAccountContext } from "@/lib/api/account-context";
import {
  deleteSharedAccountCascade,
  getAccountMembers,
  removeMember,
  getAccountsForMember,
  setDefaultAccountForMember,
  transferAccountOwnership,
} from "@/lib/db/queries";

interface SelfExitResponseBody {
  status: "member_removed" | "ownership_transferred" | "account_deleted";
  newOwnerId?: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ account: string }> }
) {
  try {
    const { account: accountSlug } = await params;

    const resolved = await resolveAccountContext(request, accountSlug);

    if ("response" in resolved) {
      return resolved.response;
    }

    const {
      account,
      memberId,
      membershipRole,
    } = resolved.context;

    if (membershipRole === "owner") {
      const members = await getAccountMembers(account.slug);
      const otherMembers = members.filter((member) => member.id !== memberId);

      if (otherMembers.length > 0) {
        const nextOwner = [...otherMembers]
          .sort((a, b) => {
            if (a.isDefault !== b.isDefault) {
              return Number(b.isDefault) - Number(a.isDefault);
            }

            const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
            const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
            return aTime - bTime;
          })[0];

        await transferAccountOwnership(account.slug, nextOwner.id);
        await removeMember(account.slug, memberId);

        const body: SelfExitResponseBody = {
          status: "ownership_transferred",
          newOwnerId: nextOwner.id,
        };
        return NextResponse.json(body, { status: 200 });
      }

      await deleteSharedAccountCascade(account.slug);

      const remainingAccounts = await getAccountsForMember(memberId);
      const fallbackAccount = remainingAccounts.find((candidate) => candidate.isDefault) ?? remainingAccounts[0];

      if (fallbackAccount) {
        await setDefaultAccountForMember(memberId, fallbackAccount.id);
      }

      const body: SelfExitResponseBody = { status: "account_deleted" };
      return NextResponse.json(body, { status: 200 });
    }

    await removeMember(account.slug, memberId);
    const body: SelfExitResponseBody = { status: "member_removed" };
    return NextResponse.json(body, { status: 200 });
  } catch (error) {
    console.error("Failed to process self exit", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
