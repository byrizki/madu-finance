"use client";

import type { ComponentType } from "react";

import { Badge } from "@/components/ui/badge";
import { Building, CreditCard, Smartphone, Wallet } from "lucide-react";

import { type WalletItem } from "@/hooks/use-wallets";
import { formatCurrency, getDaysUntilDue } from "@/lib/utils";

export const walletTypeOptions: WalletItem["type"][] = ["bank", "e_wallet", "credit_card", "cash"];

export interface AddWalletFormState {
  name: string;
  type: WalletItem["type"];
  provider: string;
  accountNumber: string;
  balance: string;
}

export interface IncreaseFormState {
  wallet: WalletItem | null;
  sourceWalletId: string;
  amount: string;
  note: string;
}

export interface DecreaseFormState {
  wallet: WalletItem | null;
  targetWalletId: string;
  amount: string;
  note: string;
}

export interface AddInstallmentFormState {
  name: string;
  type: string;
  provider: string;
  monthlyAmount: string;
  remainingAmount: string;
  dueDate: string;
}

export const fallbackColors = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-sky-500",
  "bg-rose-500",
];

export const manualWalletOptionValue = "__manual__";

export const walletTypeLabel: Record<string, string> = {
  bank: "Rekening Bank",
  e_wallet: "Dompet Digital",
  credit_card: "Kartu Kredit",
  cash: "Tunai",
};

export const walletIcon: Record<string, ComponentType<{ className?: string }>> = {
  bank: Building,
  e_wallet: Smartphone,
  credit_card: CreditCard,
  cash: Wallet,
};

export const formatWalletCurrency = (amount: number) => formatCurrency(amount);

export const getWalletColor = (color: string | null | undefined, index: number) => {
  if (color?.startsWith("bg-")) return color;
  return fallbackColors[index % fallbackColors.length];
};

export const getInstallmentStatus = (dueDate: string | null, status?: string | null) => {
  const daysUntilDue = getDaysUntilDue(dueDate);
  if (daysUntilDue === null) return status ?? "normal";
  if (daysUntilDue < 0) return "overdue";
  if (daysUntilDue <= 3) return "due-soon";
  return status ?? "upcoming";
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "overdue":
      return (
        <Badge variant="destructive" className="text-xs">
          Terlambat
        </Badge>
      );
    case "due-soon":
      return (
        <Badge variant="secondary" className="text-xs">
          Akan Datang
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          Aktif
        </Badge>
      );
  }
};
