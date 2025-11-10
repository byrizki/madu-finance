"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Target, ArrowDownRight, TrendingUp } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickTransactionSheet } from "@/components/transactions/quick-transaction-sheet";
import { BudgetModal } from "@/components/budget/budget-modal";
import { useTransactions } from "@/hooks/use-transactions";
import { useMember } from "@/components/context/member-context";
import { useAuth } from "@/components/providers/auth-provider";
import { useBudgets } from "@/hooks/use-budgets";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { UnauthorizedAccessDialog } from "@/components/unauthorized-access-dialog";
import { isUnauthorizedAccountError } from "@/lib/errors";
import { NoAccountOverlay } from "@/components/no-account-overlay";
import { cn } from "@/lib/utils";

import { BudgetOverview } from "./budget-overview";
import { BudgetHeader } from "./budget-header";
import { TransactionFilters } from "./transaction-filters";
import { TransactionList } from "./transaction-list";
import { TransactionOverview } from "./transaction-overview";
import { calculateBudgetSummary, extractCategories, filterTransactions } from "./budgets-utils";
import type { BudgetMetric } from "./budgets-types";

export interface BudgetsClientProps {
  accountSlugOverride?: string;
}

export default function BudgetsClient({ accountSlugOverride }: BudgetsClientProps = {}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "budgets" | "transactions">(() => {
    if (searchParams.has("budgets")) return "budgets";
    if (searchParams.has("transactions")) return "transactions";
    return "overview";
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");
  const [selectedType, setSelectedType] = useState("Semua Tipe");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quickTransactionSheetOpen, setQuickTransactionSheetOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const { accountSlug: memberAccountSlug } = useMember();
  const { defaultAccount, isDefaultAccountLoading } = useAuth();
  const resolvedAccountSlug = accountSlugOverride ?? memberAccountSlug ?? defaultAccount?.accountSlug ?? "";
  const isAccountResolved = Boolean(resolvedAccountSlug) && !isDefaultAccountLoading;
  const effectiveAccountSlug = isAccountResolved ? resolvedAccountSlug : undefined;
  const {
    data: transactionsData,
    isLoading: transactionsLoadingRaw,
    error: transactionsError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactions(effectiveAccountSlug, 10);
  const { data: budgets, isLoading: budgetsLoadingRaw, error: budgetsError } = useBudgets(effectiveAccountSlug);
  const isMounted = useIsMounted();
  const transactionsLoading = !isMounted || transactionsLoadingRaw || !isAccountResolved;
  const budgetsLoading = !isMounted || budgetsLoadingRaw || !isAccountResolved;

  const unauthorizedError = [transactionsError, budgetsError].find(isUnauthorizedAccountError);

  const transactionList = transactionsData?.pages.flatMap((page) => page.items) ?? [];
  const budgetList = budgets ?? [];

  const showAccountPlaceholder = !isAccountResolved && !isDefaultAccountLoading;

  useEffect(() => {
    if (searchParams.has("budgets")) {
      setActiveTab("budgets");
    } else if (searchParams.has("transactions")) {
      setActiveTab("transactions");
    } else {
      setActiveTab("overview");
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    const nextTab = value as "overview" | "budgets" | "transactions";
    setActiveTab(nextTab);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("budgets");
    params.delete("transactions");
    const baseQuery = params.toString();
    
    let target = pathname;
    if (nextTab === "budgets") {
      target = `${pathname}?${baseQuery ? `${baseQuery}&` : ""}budgets`;
    } else if (nextTab === "transactions") {
      target = `${pathname}?${baseQuery ? `${baseQuery}&` : ""}transactions`;
    } else if (baseQuery) {
      target = `${pathname}?${baseQuery}`;
    }
    
    router.replace(target, {
      scroll: false,
    });
  };

  const categories = useMemo(() => extractCategories(transactionList), [transactionList]);

  const filteredTransactions = useMemo(
    () =>
      filterTransactions(transactionList, {
        searchTerm,
        selectedCategory,
        selectedType,
        startDate,
        endDate,
      }),
    [transactionList, searchTerm, selectedCategory, selectedType, startDate, endDate]
  );

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Semua Kategori");
    setSelectedType("Semua Tipe");
    setStartDate("");
    setEndDate("");
  };

  const budgetSummary = useMemo(() => calculateBudgetSummary(budgetList), [budgetList]);

  const metrics: BudgetMetric[] = useMemo(
    () => [
      {
        id: "total-budget",
        label: "Total anggaran",
        value: budgetSummary.totalBudget,
        icon: Target,
        accent: "text-indigo-500",
      },
      {
        id: "total-spent",
        label: "Total terpakai",
        value: budgetSummary.totalSpent,
        icon: ArrowDownRight,
        accent: "text-rose-500",
      },
      {
        id: "total-remaining",
        label: "Sisa anggaran",
        value: budgetSummary.totalRemaining,
        icon: TrendingUp,
        accent: "text-emerald-500",
      },
      {
        id: "attention",
        label: "Perlu perhatian",
        value: budgetSummary.attentionCount,
        icon: Target,
        accent: "text-amber-500",
      },
    ],
    [budgetSummary]
  );

  return (
    <div className="relative">
      <div
        className={cn(
          "space-y-6 px-4 pb-24 lg:px-8 transition",
          showAccountPlaceholder ? "pointer-events-none blur-sm max-h-[calc(100vh-12rem)]" : undefined
        )}
      >
        {unauthorizedError && <UnauthorizedAccessDialog open onRedirect={() => router.replace("/dashboard/transactions")} />}
        <BudgetHeader
          activeTab={activeTab}
          onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
          onOpenTransactionModal={() => setQuickTransactionSheetOpen(true)}
          budgetsLoading={budgetsLoading}
          transactionsLoading={transactionsLoading}
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList>
            <TabsTrigger value="overview" className="px-4">
              Overview
            </TabsTrigger>
            <TabsTrigger value="transactions" className="px-4">
              Transaksi
            </TabsTrigger>
            <TabsTrigger value="budgets" className="px-6">
              Anggaran
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <TransactionOverview accountSlug={resolvedAccountSlug} />
          </TabsContent>

          <TabsContent value="budgets" className="mt-6 space-y-6">
            <BudgetOverview budgetList={budgetList} metrics={metrics} isLoading={budgetsLoading} />
          </TabsContent>

          <TabsContent value="transactions" className="mt-6 space-y-6">
            <TransactionList
              rightSection={
                <TransactionFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  category={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  categories={categories}
                  typeFilter={selectedType}
                  onTypeFilterChange={setSelectedType}
                  startDate={startDate}
                  onStartDateChange={setStartDate}
                  endDate={endDate}
                  onEndDateChange={setEndDate}
                  onReset={resetFilters}
                  summary={{ total: transactionList.length, filtered: filteredTransactions.length }}
                  accountSlug={resolvedAccountSlug}
                />
              }
              accountSlug={resolvedAccountSlug}
              filteredTransactions={filteredTransactions}
              isLoading={transactionsLoading}
              onLoadMore={fetchNextPage}
              hasMore={hasNextPage}
              isLoadingMore={isFetchingNextPage}
            />
          </TabsContent>
        </Tabs>

        <QuickTransactionSheet
          accountSlug={resolvedAccountSlug}
          open={quickTransactionSheetOpen}
          onOpenChange={(open) => setQuickTransactionSheetOpen(open)}
          mode="both"
          defaultType="expense"
          title="Catat transaksi"
          description="Pilih tipe transaksi, isi detail, dan simpan."
          showDateField
          showDescriptionField
          onSuccess={() => setQuickTransactionSheetOpen(false)}
        />
        <BudgetModal
          accountSlug={resolvedAccountSlug}
          isOpen={isBudgetModalOpen}
          onClose={() => setIsBudgetModalOpen(false)}
        />
      </div>
      {showAccountPlaceholder ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 bottom-36 z-20 flex items-center justify-center px-4 lg:px-8">
          <NoAccountOverlay className="pointer-events-auto max-w-lg shadow-lg" />
        </div>
      ) : null}
    </div>
  );
}
