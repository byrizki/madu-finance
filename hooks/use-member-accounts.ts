"use client";

import { useQuery } from "@tanstack/react-query";

export type MemberAccountRole = "owner" | "member";

export interface MemberAccountMember {
  id: string;
  name: string;
  email: string;
  role: MemberAccountRole;
}

export interface MemberAccountSummary {
  id: string;
  slug: string;
  name: string;
  role: MemberAccountRole;
  isOwner: boolean;
  isDefault: boolean;
  quickInsight: string;
  monthlyIncome: number;
  monthlyExpense: number;
  members: MemberAccountMember[];
}

interface MemberAccountsResponse {
  accounts: MemberAccountSummary[];
}

export function useMemberAccounts() {
  const query = useQuery<MemberAccountsResponse>({
    queryKey: ["member-accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts", { credentials: "include" });

      if (!response.ok) {
        throw new Error("Gagal memuat daftar Kas");
      }

      return response.json() as Promise<MemberAccountsResponse>;
    },
    staleTime: 60_000,
  });

  return {
    ...query,
    accounts: (query.data?.accounts ?? []).map((account) => ({
      id: account.id,
      slug: account.slug ?? "",
      name: account.name,
      role: account.role,
      isOwner: account.isOwner,
      isDefault: Boolean(account.isDefault),
      quickInsight: account.quickInsight ?? "Belum ada insight",
      monthlyIncome: account.monthlyIncome ?? 0,
      monthlyExpense: account.monthlyExpense ?? 0,
      members: Array.isArray(account.members)
        ? account.members.map((member: any) => ({
            id: member.id,
            name: member.name ?? "Pengguna",
            email: member.email ?? "",
            role: member.role ?? "member",
          }))
        : [],
    })),
  };
}
