import type { LucideIcon } from "lucide-react";

export type BudgetStatus = "on-track" | "warning" | "over-budget";

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  attentionCount: number;
}

export interface BudgetMetric {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
}

export type TransactionBucket = string; // Month-Year format: "2025-01", "2024-12", etc.

export interface FilterSummary {
  total: number;
  filtered: number;
}
