"use client";

import { Sparkles, ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";

interface DashboardHeaderProps {
  isLoading: boolean;
  quickInsight: string;
  showValues: boolean;
  onToggleShowValues: () => void;
  onCreateIncome?: () => void;
  onCreateExpense?: () => void;
}

export function DashboardHeader({
  isLoading,
  quickInsight,
  showValues,
  onToggleShowValues,
  onCreateIncome,
  onCreateExpense,
}: DashboardHeaderProps) {
  const srLabel = showValues ? "Sembunyikan nilai keuangan" : "Tampilkan nilai keuangan";
  const hasQuickActions = Boolean(onCreateIncome || onCreateExpense);

  return (
    <PageHeader
      badge={{
        label: isLoading ? "Lagi loading" : "Ringkasan santai",
        icon: <Sparkles className="h-3.5 w-3.5" />,
      }}
      title="Hai, selamat datang lagi!"
      description="Intip ringkasan finansial kamu dan sembunyiin angka kalau lagi nggak mau diliatin."
      insight={{
        text: quickInsight,
        onToggle: onToggleShowValues,
        active: showValues,
        srLabel,
      }}
      subContent={
        hasQuickActions ? (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button
                size="lg"
                variant="outline"
                className="h-auto w-full justify-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3  hover:text-destructive text-left text-destructive shadow-sm transition hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-60 sm:flex-1"
                onClick={() => onCreateExpense?.()}
                disabled={!onCreateExpense}
              >
                <span className="flex shrink-0 items-center justify-center rounded-full bg-destructive/15 p-2.5 text-destructive">
                  <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold">Duit Keluar</span>
              </Button>
              <Button
                size="lg"
                className="h-auto w-full justify-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left text-primary shadow-sm transition hover:bg-primary/10 disabled:pointer-events-none disabled:opacity-60 sm:flex-1"
                onClick={() => onCreateIncome?.()}
                disabled={!onCreateIncome}
              >
                <span className="flex shrink-0 items-center justify-center rounded-full bg-primary/15 p-2.5 text-primary">
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold">Duit Masuk</span>
              </Button>
            </div>
          </div>
        )
          : null
      }
    />
  );
}
