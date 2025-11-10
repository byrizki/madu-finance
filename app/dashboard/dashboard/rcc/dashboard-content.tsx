"use client";

import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Button } from "@/components/ui/button";

import type { TransactionItem } from "@/hooks/use-transactions";

import { DashboardOverviewMetrics } from "./dashboard-overview-metrics";
import type { OverviewMetric } from "./dashboard-types";

interface DashboardContentProps {
  metrics: OverviewMetric[];
  isLoading: boolean;
  transactions: TransactionItem[];
  transactionsLoading: boolean;
  transactionsError?: Error | null;
  onViewAllTransactions: () => void;
}

export function DashboardContent({
  metrics,
  isLoading,
  transactions,
  transactionsLoading,
  transactionsError,
  onViewAllTransactions,
}: DashboardContentProps) {
  return (
    <div className="space-y-6">
      <DashboardOverviewMetrics metrics={metrics} isLoading={isLoading} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Transaksi terbaru</h2>
        </div>
        <RecentTransactions 
          transactions={transactions} 
          isLoading={transactionsLoading} 
          error={transactionsError}
          onViewAll={onViewAllTransactions}
        />
      </section>
    </div>
  );
}
