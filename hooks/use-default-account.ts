"use client";

import { useQuery } from "@tanstack/react-query";

import type { DefaultAccountMembership } from "@/lib/db/queries";

export interface DefaultAccount extends DefaultAccountMembership {
  updatedAt: Date;
}

interface DefaultAccountResponse {
  account: (DefaultAccountMembership & { updatedAt: string }) | null;
}

interface UseDefaultAccountOptions {
  enabled?: boolean;
}

export function useDefaultAccount(options: UseDefaultAccountOptions = {}) {
  const enabled = options.enabled ?? true;

  const query = useQuery<DefaultAccount | null>({
    queryKey: ["default-account"],
    enabled,
    queryFn: async () => {
      const response = await fetch("/api/accounts/default", {
        credentials: "include",
      });

      const data = (await response.json().catch(() => null)) as DefaultAccountResponse | { error?: string } | null;

      if (!response.ok) {
        const errorMessage = data && "error" in data ? data.error : null;
        throw new Error(errorMessage ?? "Gagal memuat Kas default");
      }

      if (!data || !("account" in data) || !data.account) {
        return null;
      }

      return {
        ...data.account,
        updatedAt: new Date(data.account.updatedAt),
      } satisfies DefaultAccount;
    },
    staleTime: 60_000,
  });

  return {
    ...query,
    defaultAccount: query.data ?? null,
  };
}
