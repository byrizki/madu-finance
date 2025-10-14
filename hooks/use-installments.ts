"use client";

import { useQuery } from "@tanstack/react-query";

import type { InstallmentRow, InstallmentStatus } from "@/lib/db/types";
import { toast } from "sonner";

import { createUnauthorizedAccountError, isUnauthorizedAccountError } from "@/lib/errors";

export interface InstallmentItem {
  id: string;
  accountId: string;
  name: string;
  type: string;
  provider: string | null;
  monthlyAmount: number;
  remainingAmount: number;
  remainingPayments: number | null;
  dueDate: string;
  status: InstallmentStatus;
  createdAt: string;
  updatedAt: string;
}

export function useInstallments(accountSlug?: string) {
  return useQuery<InstallmentItem[], Error>({
    queryKey: ["installments", accountSlug],
    enabled: Boolean(accountSlug),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/${accountSlug}/installments`);
        if (!response.ok) {
          if (response.status === 403) {
            throw createUnauthorizedAccountError();
          }

          throw new Error("Gagal memuat cicilan");
        }
        const data = await response.json();
        const rows = data.installments as InstallmentRow[];
        return rows.map((row) => ({
          id: row.id,
          accountId: row.accountId,
          name: row.name,
          type: row.type,
          provider: row.provider,
          monthlyAmount: Number(row.monthlyAmount ?? "0"),
          remainingAmount: Number(row.remainingAmount ?? "0"),
          remainingPayments: row.remainingPayments === null || row.remainingPayments === undefined ? null : Number(row.remainingPayments),
          dueDate: row.dueDate,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
      } catch (error: unknown) {
        if (isUnauthorizedAccountError(error)) {
          throw error;
        }

        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        toast.error("Gagal memuat cicilan", {
          description: message,
        });
        throw error;
      }
    },
  });
}
