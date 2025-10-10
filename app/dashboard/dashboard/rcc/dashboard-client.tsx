"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useMember } from "@/components/context/member-context";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallets } from "@/hooks/use-wallets";
import { useTransactions } from "@/hooks/use-transactions";
import { useInstallments } from "@/hooks/use-installments";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { useShowValues } from "@/components/providers/show-values-provider";

import { UnauthorizedAccessDialog } from "@/components/unauthorized-access-dialog";
import { isUnauthorizedAccountError } from "@/lib/errors";

import { DashboardHeader } from "./dashboard-header";
import { DashboardContent } from "./dashboard-content";
import { QuickTransactionSheet } from "@/components/transactions/quick-transaction-sheet";
import { NoAccountOverlay } from "@/components/no-account-overlay";
import { cn } from "@/lib/utils";
import {
  aggregateWallets,
  aggregateMonthly,
  sortTransactions,
  totalInstallmentAmount,
  buildOverviewMetrics,
  buildQuickInsight,
} from "./dashboard-utils";

export interface DashboardClientProps {
  accountSlugOverride?: string;
}

export default function DashboardClient({ accountSlugOverride }: DashboardClientProps = {}) {
  const isMounted = useIsMounted();
  const router = useRouter();
  const { toggleShowValues, showValues } = useShowValues();
  const { accountSlug: memberAccountSlug } = useMember();
  const { defaultAccount, isDefaultAccountLoading } = useAuth();
  const resolvedAccountSlug = accountSlugOverride ?? memberAccountSlug ?? defaultAccount?.accountSlug ?? "";
  const isAccountResolved = Boolean(resolvedAccountSlug) && !isDefaultAccountLoading;
  const effectiveAccountSlug = isAccountResolved ? resolvedAccountSlug : undefined;
  const { data: wallets, isLoading: walletsLoadingRaw, error: walletsError } = useWallets(effectiveAccountSlug);
  const {
    data: transactions,
    isLoading: transactionsLoadingRaw,
    error: transactionsError,
  } = useTransactions(effectiveAccountSlug);
  const {
    data: installments,
    isLoading: installmentsLoadingRaw,
    error: installmentsError,
  } = useInstallments(effectiveAccountSlug);

  const walletsLoading = !isMounted || walletsLoadingRaw || !isAccountResolved;
  const transactionsLoading = !isMounted || transactionsLoadingRaw || !isAccountResolved;
  const installmentsLoading = !isMounted || installmentsLoadingRaw || !isAccountResolved;

  const isLoading = walletsLoading || transactionsLoading || installmentsLoading;

  const unauthorizedError = [walletsError, transactionsError, installmentsError].find(isUnauthorizedAccountError);

  const walletAggregate = useMemo(() => aggregateWallets(wallets ?? []), [wallets]);
  const monthlyAggregate = useMemo(() => aggregateMonthly(transactions ?? []), [transactions]);
  const installmentsTotal = useMemo(() => totalInstallmentAmount(installments ?? []), [installments]);
  const metrics = useMemo(
    () => buildOverviewMetrics({ wallets: walletAggregate, monthly: monthlyAggregate, installmentsTotal }),
    [walletAggregate, monthlyAggregate, installmentsTotal]
  );
  const sortedTransactions = useMemo(() => sortTransactions(transactions ?? []), [transactions]);
  const quickInsight = useMemo(
    () => buildQuickInsight(showValues, isLoading, monthlyAggregate),
    [showValues, isLoading, monthlyAggregate]
  );

  const transactionsSkeletonLoading = !isMounted || transactionsLoading;
  const [quickSheetState, setQuickSheetState] = useState<{ type: "income" | "expense" | null }>({ type: null });

  const handleOpenIncome = () => setQuickSheetState({ type: "income" });
  const handleOpenExpense = () => setQuickSheetState({ type: "expense" });
  const handleCloseSheet = () => setQuickSheetState({ type: null });

  const showAccountPlaceholder = !isAccountResolved && !isDefaultAccountLoading;

  return (
    <div className="relative">
      <div
        className={cn(
          "space-y-6 px-4 pb-24 lg:px-8 transition",
          showAccountPlaceholder ? "pointer-events-none blur-sm max-h-[calc(100vh-12rem)]" : undefined
        )}
      >
        {unauthorizedError && <UnauthorizedAccessDialog open onRedirect={() => router.replace("/dashboard")} />}
        <DashboardHeader
          isLoading={isLoading}
          quickInsight={quickInsight}
          showValues={showValues}
          onToggleShowValues={toggleShowValues}
          onCreateIncome={handleOpenIncome}
          onCreateExpense={handleOpenExpense}
        />

        <DashboardContent
          metrics={metrics}
          isLoading={isLoading}
          transactions={sortedTransactions}
          transactionsLoading={transactionsSkeletonLoading}
          transactionsError={transactionsError}
          onViewAllTransactions={() => router.push("/dashboard/transactions?transactions")}
        />

        <QuickTransactionSheet
          accountSlug={isAccountResolved ? resolvedAccountSlug : undefined}
          open={quickSheetState.type !== null}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseSheet();
              return;
            }

            if (quickSheetState.type === null) {
              setQuickSheetState({ type: "income" });
            }
          }}
          mode={quickSheetState.type === null ? "both" : quickSheetState.type}
          defaultType={quickSheetState.type ?? "income"}
          title={quickSheetState.type === "expense" ? "Tambah pengeluaran" : "Tambah pendapatan"}
          description={
            quickSheetState.type === "expense"
              ? "Catat pengeluaran baru agar anggaran tetap terkendali."
              : "Catat pemasukan baru untuk memperbarui ringkasan keuangan."
          }
          showDateField
          showDescriptionField
          onSuccess={handleCloseSheet}
        />
      </div>
      {showAccountPlaceholder ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-36 z-20 flex items-center px-4 lg:px-8">
          <NoAccountOverlay className="pointer-events-auto max-w-lg shadow-lg" />
        </div>
      ) : null}
    </div>
  );
}
