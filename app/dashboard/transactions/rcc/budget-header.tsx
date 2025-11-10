"use client";

import { BarChart3, ReceiptText } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";

interface BudgetHeaderProps {
  activeTab: "overview" | "budgets" | "transactions";
  budgetsLoading: boolean;
  transactionsLoading: boolean;
  onOpenBudgetModal: () => void;
  onOpenTransactionModal: () => void;
}

export function BudgetHeader({ activeTab, budgetsLoading, transactionsLoading, onOpenBudgetModal, onOpenTransactionModal }: BudgetHeaderProps) {
  const isBudgets = activeTab === "budgets";
  const isOverview = activeTab === "overview";
  const BadgeIcon = isBudgets ? BarChart3 : ReceiptText;
  const quickActionLabel = isBudgets ? "Tambah anggaran" : "Tambah transaksi";
  const quickActionHandler = isBudgets ? onOpenBudgetModal : onOpenTransactionModal;
  const quickActionDisabled = isBudgets ? budgetsLoading : transactionsLoading;

  const getLabel = () => {
    if (isOverview) return "Overview";
    if (isBudgets) return "Anggaran";
    return "Transaksi";
  };

  const getTitle = () => {
    if (isOverview) return "Insight keuangan kamu";
    if (isBudgets) return "Rencanain anggaran santai aja";
    return "Atur arus kas tanpa drama";
  };

  const getDescription = () => {
    if (isOverview) return "Lihat statistik lengkap, tren pengeluaran, dan perbandingan bulanan dalam satu tampilan.";
    if (isBudgets) return "Kasih batas belanja per kategori, nikmatin update progresnya, dan tetep enjoy.";
    return "Catet pemasukan dan pengeluaran di satu tempat dengan kontrol yang gampang kamu akses kapan pun.";
  };

  return (
    <PageHeader
      badge={{
        label: getLabel(),
        icon: <BadgeIcon className="h-3.5 w-3.5" />,
      }}
      title={getTitle()}
      description={getDescription()}
      subContent={
        !isOverview ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              size="lg"
              disabled={quickActionDisabled}
              onClick={quickActionHandler}
              className="h-auto w-full justify-start gap-2.5 rounded-lg bg-primary/10 px-3.5 py-2.5 text-left text-primary shadow-sm transition hover:bg-primary/15 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
            >
              <span className="flex shrink-0 items-center justify-center rounded-full bg-primary/15 p-2 text-primary sm:p-2.5">
                <BadgeIcon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold">{quickActionLabel}</span>
            </Button>
          </div>
        ) : undefined
      }
    />
  );
}
