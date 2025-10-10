"use client";

import { AlertTriangle, CheckCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { BudgetStatus } from "./budgets-types";

interface BudgetStatusBadgeProps {
  status: BudgetStatus;
}

export function BudgetStatusBadge({ status }: BudgetStatusBadgeProps) {
  if (status === "over-budget") {
    return (
      <Badge variant="destructive" className="flex items-center gap-1 rounded-full">
        <AlertTriangle className="h-3.5 w-3.5" />
        Melebihi
      </Badge>
    );
  }

  if (status === "warning") {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 rounded-full">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
        Hampir penuh
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="flex items-center gap-1 rounded-full">
      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
      Terkendali
    </Badge>
  );
}
