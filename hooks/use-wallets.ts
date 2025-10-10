"use client";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import type { WalletRow, WalletType } from "@/lib/db/types";

import { createUnauthorizedAccountError, isUnauthorizedAccountError } from "@/lib/errors";

export interface WalletItem {
  id: string;
  accountId: string;
  name: string;
  type: WalletType;
  provider: string | null;
  accountNumber: string | null;
  color: string | null;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export function useWallets(accountSlug?: string) {
  return useQuery<WalletItem[], Error>({
    queryKey: ["wallets", accountSlug],
    enabled: Boolean(accountSlug),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/${accountSlug}/wallets`);
        if (!response.ok) {
          if (response.status === 403) {
            throw createUnauthorizedAccountError();
          }

          throw new Error("Gagal memuat dompet");
        }
        const data = await response.json();
        const rows = data.wallets as WalletRow[];
        return rows.map((row) => ({
          id: row.id,
          accountId: row.accountId,
          name: row.name,
          type: row.type,
          provider: row.provider,
          accountNumber: row.accountNumber,
          color: row.color,
          balance: Number(row.balance ?? "0"),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
      } catch (error: unknown) {
        if (isUnauthorizedAccountError(error)) {
          throw error;
        }

        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        toast.error("Gagal memuat dompet", {
          description: message,
        });
        throw error;
      }
    },
  });
}
