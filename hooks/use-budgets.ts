"use client";

import { useQuery } from "@tanstack/react-query";

import type { BudgetPeriod, BudgetRow, BudgetStatus } from "@/lib/db/types";
import { toast } from "sonner";

import { createUnauthorizedAccountError, isUnauthorizedAccountError } from "@/lib/errors";

export interface BudgetItem {
  id: string;
  accountId: string;
  category: string;
  amount: number;
  spentAmount: number;
  period: BudgetPeriod;
  startDate: string;
  endDate: string | null;
  status: BudgetStatus;
  createdAt: string;
  updatedAt: string;
}

export function useBudgets(accountSlug?: string) {
  return useQuery<BudgetItem[], Error>({
    queryKey: ["budgets", accountSlug],
    enabled: Boolean(accountSlug),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/${accountSlug}/budgets`);
        if (!response.ok) {
          if (response.status === 403) {
            throw createUnauthorizedAccountError();
          }

          throw new Error("Gagal memuat anggaran");
        }
        const data = await response.json();
        const rows = data.budgets as BudgetRow[];
        return rows.map((row) => ({
          id: row.id,
          accountId: row.accountId,
          category: row.category,
          amount: Number(row.amount ?? "0"),
          spentAmount: Number(row.spentAmount ?? "0"),
          period: row.period,
          startDate: row.startDate,
          endDate: row.endDate,
          status: row.status,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
      } catch (error: unknown) {
        if (isUnauthorizedAccountError(error)) {
          throw error;
        }

        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        toast.error("Gagal memuat anggaran", {
          description: message,
        });
        throw error;
      }
    },
  });
}
