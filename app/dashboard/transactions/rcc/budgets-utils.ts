import type { BudgetItem } from "@/hooks/use-budgets";
import type { TransactionItem } from "@/hooks/use-transactions";

import type { BudgetStatus, BudgetSummary, TransactionBucket } from "./budgets-types";

export interface TransactionFilterOptions {
  searchTerm: string;
  selectedCategory: string;
  selectedType: string;
  startDate: string;
  endDate: string;
}

export const formatDate = (dateString?: string | null) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const getTransactionBucket = (dateString: string): TransactionBucket => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays <= 0) return "today";
  if (diffInDays === 1) return "yesterday";
  if (diffInDays <= 7) return "last7";
  if (diffInDays <= 30) return "last30";
  return "older";
};

export const bucketLabels: Record<TransactionBucket, string> = {
  today: "Hari ini",
  yesterday: "Kemarin",
  last7: "7 hari terakhir",
  last30: "30 hari terakhir",
  older: "Lebih lama",
};

export const getBudgetStatus = (amount: number, spent: number): BudgetStatus => {
  if (amount === 0) {
    return "on-track";
  }
  const ratio = spent / amount;
  if (ratio >= 1) return "over-budget";
  if (ratio >= 0.8) return "warning";
  return "on-track";
};

export const filterTransactions = (
  transactions: TransactionItem[],
  { searchTerm, selectedCategory, selectedType, startDate, endDate }: TransactionFilterOptions,
) => {
  const normalizedStart = startDate ? new Date(startDate) : null;
  const normalizedEnd = endDate ? new Date(endDate) : null;

  if (normalizedStart) {
    normalizedStart.setHours(0, 0, 0, 0);
  }

  if (normalizedEnd) {
    normalizedEnd.setHours(23, 59, 59, 999);
  }

  const searchLower = searchTerm.toLowerCase();

  return transactions.filter((transaction) => {
    const matchesSearch =
      transaction.title.toLowerCase().includes(searchLower) ||
      (transaction.description ?? "").toLowerCase().includes(searchLower) ||
      transaction.category.toLowerCase().includes(searchLower);

    const matchesCategory = selectedCategory === "Semua Kategori" || transaction.category === selectedCategory;

    const matchesType =
      selectedType === "Semua Tipe" ||
      (selectedType === "Pemasukan" && transaction.type === "income") ||
      (selectedType === "Pengeluaran" && transaction.type === "expense");

    const transactionDate = new Date(transaction.occurredAt ?? transaction.createdAt);
    const isValidDate = !Number.isNaN(transactionDate.getTime());
    const matchesStartDate = !normalizedStart || !isValidDate || transactionDate >= normalizedStart;
    const matchesEndDate = !normalizedEnd || !isValidDate || transactionDate <= normalizedEnd;

    return matchesSearch && matchesCategory && matchesType && matchesStartDate && matchesEndDate;
  });
};

export const extractCategories = (transactions: TransactionItem[]) => {
  const unique = new Set<string>();
  transactions.forEach((transaction) => {
    if (transaction.category) {
      unique.add(transaction.category);
    }
  });
  return ["Semua Kategori", ...Array.from(unique)];
};

export const calculateBudgetSummary = (budgetList: BudgetItem[]): BudgetSummary => {
  if (!budgetList.length) {
    return {
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      attentionCount: 0,
    };
  }

  let attentionCount = 0;
  const aggregate = budgetList.reduce(
    (accumulator, budget) => {
      const status = budget.status ?? getBudgetStatus(budget.amount, budget.spentAmount);
      if (status !== "on-track") {
        attentionCount += 1;
      }
      return {
        totalBudget: accumulator.totalBudget + budget.amount,
        totalSpent: accumulator.totalSpent + budget.spentAmount,
      };
    },
    { totalBudget: 0, totalSpent: 0 },
  );

  return {
    totalBudget: aggregate.totalBudget,
    totalSpent: aggregate.totalSpent,
    totalRemaining: Math.max(aggregate.totalBudget - aggregate.totalSpent, 0),
    attentionCount,
  };
};

export const groupTransactionsByBucket = (transactions: TransactionItem[]) => {
  return transactions.reduce<Record<TransactionBucket, TransactionItem[]>>(
    (accumulator, transaction) => {
      const occurredAt = transaction.occurredAt ?? transaction.createdAt;
      const bucket = occurredAt ? getTransactionBucket(occurredAt) : "older";
      accumulator[bucket].push(transaction);
      return accumulator;
    },
    {
      today: [],
      yesterday: [],
      last7: [],
      last30: [],
      older: [],
    },
  );
};
