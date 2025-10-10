"use client";

import { useQuery } from "@tanstack/react-query";

import type { TransactionRow, TransactionType, TransactionActivityAction } from "@/lib/db/types";
import { toast } from "sonner";

import { createUnauthorizedAccountError, isUnauthorizedAccountError } from "@/lib/errors";

export interface TransactionItem {
  id: string;
  accountId: string;
  walletId: string | null;
  memberId: string | null;
  type: TransactionType;
  title: string;
  category: string;
  amount: number;
  occurredAt: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  latestActivity: {
    actorId: string | null;
    actorName: string | null;
    actorAvatarUrl: string | null;
    action: TransactionActivityAction;
    createdAt: string;
  } | null;
}

export function useTransactions(accountSlug?: string) {
  type TransactionResponseRow = TransactionRow & {
    latestActivity: {
      actorId: string | null;
      actorName: string | null;
      actorAvatarUrl: string | null;
      action: TransactionActivityAction;
      createdAt: string;
    } | null;
  };

  return useQuery<TransactionItem[], Error>({
    queryKey: ["transactions", accountSlug],
    enabled: Boolean(accountSlug),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/${accountSlug}/transactions`);
        if (!response.ok) {
          if (response.status === 403) {
            throw createUnauthorizedAccountError();
          }

          throw new Error("Gagal memuat transaksi");
        }
        const data = await response.json();
        const rows = data.transactions as TransactionResponseRow[];
        return rows.map((row) => ({
          id: row.id,
          accountId: row.accountId,
          walletId: row.walletId,
          memberId: row.memberId,
          type: row.type,
          title: row.title,
          category: row.category,
          amount: Number(row.amount ?? "0"),
          occurredAt: row.occurredAt,
          description: row.description,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          latestActivity: row.latestActivity
            ? {
                actorId: row.latestActivity.actorId,
                actorName: row.latestActivity.actorName,
                actorAvatarUrl: row.latestActivity.actorAvatarUrl,
                action: row.latestActivity.action,
                createdAt: row.latestActivity.createdAt,
              }
            : null,
        }));
      } catch (error: unknown) {
        if (isUnauthorizedAccountError(error)) {
          throw error;
        }

        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        toast.error("Gagal memuat transaksi", {
          description: message,
        });
        throw error;
      }
    },
  });
}
