import type { LucideIcon } from "lucide-react";
import type { TransactionItem } from "@/hooks/use-transactions";

export interface OverviewMetric {
  id: string;
  title: string;
  description: string;
  value: number;
  icon: LucideIcon;
  accent: string;
}

export interface WalletAggregate {
  totalBalance: number;
  totalDebt: number;
}

export interface MonthlyAggregate {
  monthlyIncome: number;
  monthlyExpense: number;
  savings: number;
}

export interface DashboardState {
  wallets: WalletAggregate;
  monthly: MonthlyAggregate;
  transactions: TransactionItem[];
}
