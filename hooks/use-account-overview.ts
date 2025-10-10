"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  InstallmentRow,
  MemberRow,
  MembershipRole,
  SharedAccountWithOwnerRow,
  TransactionRow,
  WalletRow,
} from "@/lib/db/types";
import { toast } from "sonner";

import { createUnauthorizedAccountError, isUnauthorizedAccountError } from "@/lib/errors";

type SharedAccountWithOwner = SharedAccountWithOwnerRow;

type MemberWithRole = MemberRow & {
  role: MembershipRole;
};

export interface AccountDashboardSummary {
  account: SharedAccountWithOwner;
  wallets: WalletRow[];
  transactions: TransactionRow[];
  installments: InstallmentRow[];
}

export interface AccountSummaryResponse {
  account: SharedAccountWithOwner;
}

export interface AccountMembersResponse {
  members: MemberWithRole[];
}

export function useAccountDashboardSummary(accountSlug?: string) {
  return useQuery<AccountDashboardSummary, Error>({
    queryKey: ["account-dashboard-summary", accountSlug],
    enabled: Boolean(accountSlug),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/${accountSlug}/overview`);
        if (!response.ok) {
          if (response.status === 403) {
            throw createUnauthorizedAccountError();
          }

          throw new Error("Gagal memuat ringkasan dashboard");
        }
        return response.json() as Promise<AccountDashboardSummary>;
      } catch (error: unknown) {
        if (isUnauthorizedAccountError(error)) {
          throw error;
        }

        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        toast.error("Gagal memuat data dashboard", { description: message });
        throw error;
      }
    },
  });
}

export function useAccountDetails(accountSlug?: string) {
  return useQuery<AccountSummaryResponse, Error>({
    queryKey: ["account-details", accountSlug],
    enabled: Boolean(accountSlug),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/${accountSlug}`);

        if (response.status === 404) {
          throw new Error("Kas tidak ditemukan");
        }

        if (!response.ok) {
          if (response.status === 403) {
            throw createUnauthorizedAccountError();
          }

          throw new Error("Gagal memuat informasi Kas");
        }

        return response.json() as Promise<AccountSummaryResponse>;
      } catch (error: unknown) {
        if (isUnauthorizedAccountError(error)) {
          throw error;
        }

        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        toast.error("Gagal memuat informasi Kas", { description: message });
        throw error;
      }
    },
  });
}

export function useAccountMembers(accountSlug?: string) {
  return useQuery<AccountMembersResponse, Error>({
    queryKey: ["account-members", accountSlug],
    enabled: Boolean(accountSlug),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/${accountSlug}/members`);
        if (!response.ok) {
          if (response.status === 403) {
            throw createUnauthorizedAccountError();
          }

          throw new Error("Gagal memuat anggota Kas");
        }
        return response.json() as Promise<AccountMembersResponse>;
      } catch (error: unknown) {
        if (isUnauthorizedAccountError(error)) {
          throw error;
        }

        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        toast.error("Gagal memuat data anggota", { description: message });
        throw error;
      }
    },
  });
}

export type { WalletRow, InstallmentRow, TransactionRow, MemberWithRole, SharedAccountWithOwner };
