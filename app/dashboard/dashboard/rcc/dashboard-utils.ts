import { ArrowDownRight, ArrowUpRight, Receipt, Wallet } from "lucide-react";

import type { WalletItem } from "@/hooks/use-wallets";
import type { TransactionItem } from "@/hooks/use-transactions";
import type { InstallmentItem } from "@/hooks/use-installments";

import { formatCompactCurrency } from "@/lib/utils";

import type { MonthlyAggregate, OverviewMetric, WalletAggregate } from "./dashboard-types";

export const createMonthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

export const aggregateWallets = (wallets: WalletItem[] = []): WalletAggregate => {
  if (!wallets.length) {
    return { totalBalance: 0, totalDebt: 0 };
  }

  const positiveBalance = wallets
    .filter((wallet) => wallet.balance >= 0)
    .reduce((sum, wallet) => sum + wallet.balance, 0);
  const debt = wallets
    .filter((wallet) => wallet.balance < 0)
    .reduce((sum, wallet) => sum + Math.abs(wallet.balance), 0);

  return {
    totalBalance: positiveBalance,
    totalDebt: debt,
  };
};

export const aggregateMonthly = (transactions: TransactionItem[] = []): MonthlyAggregate => {
  if (!transactions.length) {
    return { monthlyIncome: 0, monthlyExpense: 0, savings: 0 };
  }

  const now = new Date();
  const currentKey = createMonthKey(now);

  return transactions.reduce(
    (accumulator, transaction) => {
      if (!transaction.occurredAt) return accumulator;
      const key = createMonthKey(new Date(transaction.occurredAt));
      if (key !== currentKey) return accumulator;

      if (transaction.type === "income") {
        accumulator.monthlyIncome += transaction.amount;
      } else {
        accumulator.monthlyExpense += Math.abs(transaction.amount);
      }
      accumulator.savings = Math.max(accumulator.monthlyIncome - accumulator.monthlyExpense, 0);
      return accumulator;
    },
    { monthlyIncome: 0, monthlyExpense: 0, savings: 0 },
  );
};

export const sortTransactions = (transactions: TransactionItem[] = []) => {
  return [...transactions].sort((a, b) => {
    const dateA = a.occurredAt ? new Date(a.occurredAt).getTime() : new Date(a.createdAt).getTime();
    const dateB = b.occurredAt ? new Date(b.occurredAt).getTime() : new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
};

export const totalInstallmentAmount = (installments: InstallmentItem[] = []) => {
  if (!installments.length) return 0;
  return installments.reduce((sum, item) => sum + item.remainingAmount, 0);
};

interface OverviewInput {
  wallets: WalletAggregate;
  monthly: MonthlyAggregate;
  installmentsTotal: number;
}

export const buildOverviewMetrics = ({ wallets, monthly, installmentsTotal }: OverviewInput): OverviewMetric[] => {
  return [
    {
      id: "wallet-summary",
      title: "Total Saldo",
      description: "Gabungan semua dompet positif",
      value: wallets.totalBalance,
      icon: Wallet,
      accent: "text-indigo-600",
    },
    {
      id: "installment-summary",
      title: "Total Tagihan",
      description: "Sisa cicilan aktif",
      value: installmentsTotal,
      icon: Receipt,
      accent: "text-amber-600",
    },
    {
      id: "income-summary",
      title: "Total Pendapatan",
      description: "Tercatat bulan ini",
      value: monthly.monthlyIncome,
      icon: ArrowUpRight,
      accent: "text-emerald-600",
    },
    {
      id: "expense-summary",
      title: "Total Pengeluaran",
      description: "Sampai hari ini",
      value: monthly.monthlyExpense,
      icon: ArrowDownRight,
      accent: "text-rose-600",
    },
  ];
};

export const buildQuickInsight = (
  showValues: boolean,
  isLoading: boolean,
  monthly: MonthlyAggregate,
): string => {
  if (!showValues) {
    return "Nilai disembunyikan. Ketuk untuk menampilkan nilai.";
  }

  if (isLoading) {
    return "Mengumpulkan data terbaru";
  }

  if (monthly.monthlyIncome === 0 && monthly.monthlyExpense === 0) {
    return "Belum ada aktivitas bulan ini";
  }

  if (monthly.monthlyIncome > monthly.monthlyExpense) {
    return `Tabungan Anda bertambah ${formatCompactCurrency(monthly.savings)} bulan ini.`;
  }

  if (monthly.monthlyExpense > monthly.monthlyIncome) {
    return `Pengeluaran melebihi pemasukan sebesar ${formatCompactCurrency(monthly.monthlyExpense - monthly.monthlyIncome)}.`;
  }

  return "Keuangan seimbang bulan ini.";
};
