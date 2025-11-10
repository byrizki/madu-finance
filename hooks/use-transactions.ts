"use client";

import { useQuery, useInfiniteQuery } from "@tanstack/react-query";

import type { TransactionRow, TransactionType, TransactionActivityAction, WalletSummary } from "@/lib/db/types";
import { toast } from "sonner";

import { createUnauthorizedAccountError, isUnauthorizedAccountError } from "@/lib/errors";

export interface TransactionItem {
  id: string;
  accountId: string;
  walletId: string | null;
  wallet: WalletSummary | null;
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

type TransactionResponseRow = TransactionRow & {
  wallet: WalletSummary | null;
  latestActivity: {
    actorId: string | null;
    actorName: string | null;
    actorAvatarUrl: string | null;
    action: TransactionActivityAction;
    createdAt: string;
  } | null;
};

function mapTransactionRow(row: TransactionResponseRow): TransactionItem {
  return {
    id: row.id,
    accountId: row.accountId,
    walletId: row.walletId,
    wallet: row.wallet ?? null,
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
  };
}

export function useTransactions(accountSlug?: string, pageSize = 20) {
  return useInfiniteQuery<
    { items: TransactionItem[]; nextCursor: string | null; hasMore: boolean },
    Error
  >({
    queryKey: ["transactions", accountSlug, pageSize],
    enabled: Boolean(accountSlug),
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      try {
        const params = new URLSearchParams();
        params.set("limit", pageSize.toString());
        if (pageParam) {
          params.set("cursor", pageParam as string);
        }

        const response = await fetch(`/api/${accountSlug}/transactions?${params.toString()}`);
        if (!response.ok) {
          if (response.status === 403) {
            throw createUnauthorizedAccountError();
          }

          throw new Error("Gagal memuat transaksi");
        }
        const data = await response.json();
        const rows = data.items as TransactionResponseRow[];
        return {
          items: rows.map(mapTransactionRow),
          nextCursor: data.nextCursor,
          hasMore: data.hasMore,
        };
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
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export interface TransactionOverview {
  stats: {
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    transactionCount: number;
    avgTransaction: number;
  };
  categoryData: Array<{ name: string; value: number }>;
  monthlyData: Array<{
    month: string;
    income: number;
    expense: number;
    net: number;
  }>;
}

export function useTransactionOverview(accountSlug?: string) {
  return useQuery<TransactionOverview, Error>({
    queryKey: ["transaction-overview", accountSlug],
    enabled: Boolean(accountSlug),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/${accountSlug}/transactions/overview`);
        if (!response.ok) {
          if (response.status === 403) {
            throw createUnauthorizedAccountError();
          }

          throw new Error("Gagal memuat overview transaksi");
        }
        return await response.json();
      } catch (error: unknown) {
        if (isUnauthorizedAccountError(error)) {
          throw error;
        }

        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        toast.error("Gagal memuat overview transaksi", {
          description: message,
        });
        throw error;
      }
    },
  });
}
