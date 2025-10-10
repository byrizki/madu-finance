"use client";

import { Calendar, AlertCircle, Clock, PiggyBank } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MaskedValue } from "@/components/dashboard/masked-value";
import type { InstallmentItem } from "@/hooks/use-installments";

import { getInstallmentStatus, getStatusBadge, getWalletColor } from "./wallet-utils";

interface WalletInstallmentsTabProps {
  installmentsLoading: boolean;
  installmentList: InstallmentItem[];
  onAddInstallment: () => void;
  onPayInstallment: (installment: InstallmentItem) => void;
  onShowDetail: (installment: InstallmentItem) => void;
  formatDate: (value: string | null) => string;
  getDaysUntilDue: (value: string | null) => number | null;
}

function WalletInstallmentsTab({
  installmentsLoading,
  installmentList,
  onAddInstallment,
  onPayInstallment,
  onShowDetail,
  formatDate,
  getDaysUntilDue,
}: WalletInstallmentsTabProps) {
  const isInstallmentsEmpty = !installmentsLoading && installmentList.length === 0;

  if (installmentsLoading) {
    return (
      <div className="grid gap-2.5 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={`installment-skeleton-${index}`} className="border border-border/50 bg-card/60 shadow-none">
            <CardContent className="flex flex-col gap-3 p-3">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2.5 w-20" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-18 rounded-full" />
                  <Skeleton className="h-3.5 w-3.5 rounded-full" />
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-28" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-3 w-18" />
                <Skeleton className="h-3 w-18" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isInstallmentsEmpty) {
    return (
      <Card className="border border-dashed border-border/50 bg-card/60 shadow-none">
        <CardContent className="flex flex-col items-center gap-2.5 py-8 text-center text-muted-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Belum ada cicilan aktif</p>
            <p className="text-sm">Tambahkan cicilan untuk memantau pembayaran setiap bulan.</p>
          </div>
          <Button disabled={installmentsLoading} variant="outline" size="sm" className="px-3" onClick={onAddInstallment}>
            Tambah cicilan
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {installmentList.map((installment, index) => {
        const status = getInstallmentStatus(installment.dueDate, installment.status);
        const daysUntilDue = getDaysUntilDue(installment.dueDate);
        const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
        const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;
        const accentColor = getWalletColor(installment.provider ? null : undefined, index);

        return (
          <Card
            key={installment.id}
            className={`border border-border/60 bg-card/80 shadow-none transition-transform hover:-translate-y-0.5 hover:shadow-sm ${
              isOverdue
                ? "border-red-200 bg-red-50/60 dark:bg-red-950/20"
                : isDueSoon
                ? "border-amber-200 bg-amber-50/60 dark:bg-amber-950/20"
                : ""
            }`}
          >
            <CardContent className="flex flex-col gap-3.5 p-3.5">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full ${accentColor} text-white`}>
                    <PiggyBank className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{installment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[installment.provider, installment.type].filter(Boolean).join(" • ") || "Tidak ada info tambahan"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(status)}
                  {(isOverdue || isDueSoon) && (
                    <AlertCircle className={`h-4 w-4 ${isOverdue ? "text-red-500" : "text-amber-500"}`} />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cicilan bulanan</span>
                  <MaskedValue className="font-medium text-foreground" value={installment.monthlyAmount} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sisa hutang</span>
                  <MaskedValue className="font-medium text-foreground" value={installment.remainingAmount} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jatuh tempo</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className={`font-medium ${isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : ""}`}>
                      {formatDate(installment.dueDate)}
                    </span>
                  </div>
                </div>
                {daysUntilDue !== null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isOverdue ? "Terlambat" : "Sisa hari"}</span>
                    <span className={`font-medium ${isDueSoon ? "text-amber-600" : ""}`}>{Math.abs(daysUntilDue)} hari</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className={`rounded-full ${
                    isOverdue
                      ? "bg-red-600 hover:bg-red-700"
                      : isDueSoon
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-primary hover:bg-primary/90"
                  } text-primary-foreground`}
                  onClick={() => onPayInstallment(installment)}
                >
                  Bayar sekarang
                </Button>
                <Button size="sm" variant="outline" className="rounded-full px-2.5" onClick={() => onShowDetail(installment)}>
                  Detail
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default WalletInstallmentsTab;
