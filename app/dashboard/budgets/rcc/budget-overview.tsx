"use client";

import { Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MaskedValue } from "@/components/dashboard/masked-value";
import { useShowValues } from "@/components/providers/show-values-provider";

import type { BudgetItem } from "@/hooks/use-budgets";

import { BudgetStatusBadge } from "./budget-status-badge";
import type { BudgetMetric } from "./budgets-types";
import { formatDate, getBudgetStatus } from "./budgets-utils";

interface BudgetOverviewProps {
  budgetList: BudgetItem[];
  metrics: BudgetMetric[];
  isLoading: boolean;
}

export function BudgetOverview({ budgetList, isLoading }: BudgetOverviewProps) {
  const { showValues, toggleShowValues } = useShowValues();

  return (
    <section className="space-y-5">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Daftar anggaran</h2>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={toggleShowValues}>
            {showValues ? "Sembunyikan" : "Tampilkan"} nominal
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={`budget-skeleton-${index}`} className="border border-border/60 bg-card/80 shadow-none">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : budgetList.length === 0 ? (
          <Card className="border border-dashed border-border/60 bg-card/60 shadow-none">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
                <Target className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">Belum ada anggaran</p>
              <p className="text-sm">Tambahkan anggaran untuk memantau pengeluaran per kategori.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {budgetList.map((budget) => {
              const progress = budget.amount === 0 ? 0 : Math.min((budget.spentAmount / budget.amount) * 100, 100);
              const status = budget.status ?? getBudgetStatus(budget.amount, budget.spentAmount);

              return (
                <Card
                  key={budget.id}
                  className={`border border-border/60 bg-card/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    status === "over-budget"
                      ? "border-rose-200 bg-rose-50/60 dark:bg-rose-950/20"
                      : status === "warning"
                        ? "border-amber-200 bg-amber-50/60 dark:bg-amber-950/20"
                        : ""
                  }`}
                >
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-foreground">{budget.category}</h3>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                        </p>
                      </div>
                      <BudgetStatusBadge status={status} />
                    </div>

                    <div className="grid gap-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Batas anggaran</span>
                        <MaskedValue className="font-semibold text-foreground" value={budget.amount} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Terpakai</span>
                        <MaskedValue className="font-semibold text-foreground" value={budget.spentAmount} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-muted">
                          <div
                            className={`h-2 rounded-full ${
                              status === "over-budget"
                                ? "bg-rose-500"
                                : status === "warning"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="w-12 text-xs text-right text-muted-foreground">{Math.round(progress)}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
