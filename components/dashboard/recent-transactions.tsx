"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

import type { TransactionItem } from "@/hooks/use-transactions";
import { TransactionCard } from "@/components/transactions/transaction-card";
import { UnauthorizedAccessDialog } from "@/components/unauthorized-access-dialog";
import { isUnauthorizedAccountError } from "@/lib/errors";

interface RecentTransactionsProps {
  transactions?: TransactionItem[];
  isLoading?: boolean;
  error?: Error | null;
  onViewAll?: () => void;
}

export function RecentTransactions({ transactions, isLoading, error, onViewAll }: RecentTransactionsProps) {
  const router = useRouter();
  const items = transactions?.slice(0, 5) ?? [];
  const showEmpty = !isLoading && items.length === 0;
  const unauthorizedError = isUnauthorizedAccountError(error ?? null);

  return (
    <div className="space-y-3">
      {unauthorizedError ? (
        <UnauthorizedAccessDialog
          open
          onRedirect={() => {
            router.replace("/dashboard");
          }}
        />
      ) : null}
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={`recent-tx-skeleton-${index}`}
              className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/40 p-3.5"
            >
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      ) : showEmpty ? (
        <div className="flex flex-col items-center gap-2.5 rounded-3xl border border-dashed border-border/60 bg-muted/30 py-8 text-center text-muted-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
            <Search className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Belum ada transaksi</p>
            <p className="text-sm text-muted-foreground">Pencatatan transaksi terbaru akan tampil di sini.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2.5">
            {items.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </div>
          {onViewAll && items.length > 0 && (
            <div className="flex justify-center pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full text-sm" 
                onClick={onViewAll}
              >
                Lihat semua
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
