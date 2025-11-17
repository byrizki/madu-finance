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
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const getBucketLabel = (bucket: TransactionBucket): string => {
  const [year, month] = bucket.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
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
  const grouped: Record<string, TransactionItem[]> = {};
  
  transactions.forEach((transaction) => {
    const occurredAt = transaction.occurredAt ?? transaction.createdAt;
    if (occurredAt) {
      const bucket = getTransactionBucket(occurredAt);
      if (!grouped[bucket]) {
        grouped[bucket] = [];
      }
      grouped[bucket].push(transaction);
    }
  });
  
  // Sort buckets by date (newest first)
  const sortedBuckets = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const sortedGrouped: Record<string, TransactionItem[]> = {};
  
  sortedBuckets.forEach((bucket) => {
    sortedGrouped[bucket] = grouped[bucket].sort((a, b) => {
      const dateA = new Date(a.occurredAt ?? a.createdAt);
      const dateB = new Date(b.occurredAt ?? b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  });
  
  return sortedGrouped;
};
