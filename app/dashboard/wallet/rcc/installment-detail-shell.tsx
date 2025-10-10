"use client";

import { ModalShell } from "@/components/dashboard/modal-shell";
import { Button } from "@/components/ui/button";

import type { InstallmentItem } from "@/hooks/use-installments";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DetailInstallmentShellProps {
  open: boolean;
  installment: InstallmentItem | null;
  onOpenChange: (open: boolean) => void;
}

function DetailInstallmentShell({ open, installment, onOpenChange }: DetailInstallmentShellProps) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={installment?.name ?? "Detail cicilan"}
      description={
        installment
          ? `Cicilan ${installment.type} dengan sisa ${formatCurrency(installment.remainingAmount)}.`
          : undefined
      }
    >
      {installment ? (
        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Penyedia</span>
            <span className="font-medium text-foreground">{installment.provider ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jenis cicilan</span>
            <span className="font-medium text-foreground">{installment.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cicilan bulanan</span>
            <span className="font-medium text-foreground">{formatCurrency(installment.monthlyAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sisa hutang</span>
            <span className="font-medium text-foreground">{formatCurrency(installment.remainingAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jatuh tempo</span>
            <span className="font-medium text-foreground">{formatDate(installment.dueDate)}</span>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Cicilan tidak ditemukan.</p>
      )}
    </ModalShell>
  );
}

export default DetailInstallmentShell;
