"use client";

import { ArrowDownRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { TransactionCard } from "@/components/transactions/transaction-card";

import type { TransactionItem } from "@/hooks/use-transactions";
import { deleteTransaction, updateTransaction } from "@/utils/transactions-service";

import { bucketLabels, groupTransactionsByBucket } from "./budgets-utils";

interface TransactionListProps {
  filteredTransactions: TransactionItem[];
  isLoading: boolean;
  rightSection?: React.ReactNode;
  accountSlug?: string;
  onEditTransaction?: (transaction: TransactionItem) => void;
  onDeleteTransaction?: (transaction: TransactionItem) => void;
}

export function TransactionList({
  filteredTransactions,
  isLoading,
  rightSection,
  accountSlug,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionListProps) {
  const grouped = groupTransactionsByBucket(filteredTransactions);
  const hasTransactions = filteredTransactions.length > 0;
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async ({ transaction, slug }: { transaction: TransactionItem; slug: string }) => {
      const amount = Math.abs(transaction.amount);

      await updateTransaction({
        accountSlug: slug,
        transactionId: transaction.id,
        payload: {
          type: transaction.type,
          title: transaction.title,
          category: transaction.category,
          amount,
          occurredAt: transaction.occurredAt ?? transaction.createdAt,
          description: transaction.description ?? null,
          walletId: transaction.walletId,
          memberId: transaction.memberId,
        },
      });

      return transaction;
    },
    onSuccess: async (transaction, { slug }) => {
      await queryClient.invalidateQueries({ queryKey: ["transactions", slug] });
      toast.success("Transaksi diperbarui", {
        description: `Transaksi "${transaction.title}" berhasil diperbarui.`,
      });
      onEditTransaction?.(transaction);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error("Gagal memperbarui transaksi", { description: message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ transaction, slug }: { transaction: TransactionItem; slug: string }) => {
      await deleteTransaction({ accountSlug: slug, transactionId: transaction.id });
      return transaction;
    },
    onSuccess: async (transaction, { slug }) => {
      await queryClient.invalidateQueries({ queryKey: ["transactions", slug] });
      toast.success("Transaksi dihapus", {
        description: `Transaksi "${transaction.title}" telah dihapus.`,
      });
      onDeleteTransaction?.(transaction);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error("Gagal menghapus transaksi", { description: message });
    },
  });

  const handleEdit = async (transaction: TransactionItem) => {
    if (!accountSlug) {
      toast.error("Akun belum siap", {
        description: "Silakan pilih akun terlebih dahulu sebelum mengubah transaksi.",
      });
      return;
    }

    await updateMutation.mutateAsync({ transaction, slug: accountSlug });
  };

  const handleDelete = async (transaction: TransactionItem) => {
    if (!accountSlug) {
      toast.error("Akun belum siap", {
        description: "Silakan pilih akun terlebih dahulu sebelum menghapus transaksi.",
      });
      return;
    }

    await deleteMutation.mutateAsync({ transaction, slug: accountSlug });
  };

  return (
    <section className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">Riwayat transaksi</h2>
        {rightSection}
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={`skeleton-group-${index}`} className="border border-border/50 bg-card/80 shadow-none">
              <CardContent className="space-y-2.5 p-3.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-14" />
                </div>
                {Array.from({ length: 2 }).map((__, itemIndex) => (
                  <Skeleton key={`skeleton-${index}-${itemIndex}`} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !hasTransactions ? (
        <Card className="border border-dashed border-border/50 bg-card/60 shadow-none">
          <CardContent className="flex flex-col items-center gap-2.5 py-6 text-center text-muted-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
              <ArrowDownRight className="h-4 w-4" />
            </div>
            <p className="text-sm font-semibold text-foreground">Belum ada transaksi sesuai filter</p>
            <p className="text-sm">Ubah filter pencarian atau tambahkan transaksi baru.</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped)
          .filter(([, items]) => items.length > 0)
          .map(([bucket, items]) => (
            <div key={bucket} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                    {bucketLabels[bucket as keyof typeof bucketLabels]}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{items.length} transaksi</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {items.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    accountSlug={accountSlug}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))
      )}
    </section>
  );
}
