"use client";

import { ModalShell } from "@/components/dashboard/modal-shell";
import { Button } from "@/components/ui/button";

import type { InstallmentItem } from "@/hooks/use-installments";

interface CloseInstallmentShellProps {
  open: boolean;
  submitting: boolean;
  installment: InstallmentItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
}

function CloseInstallmentShell({
  open,
  submitting,
  installment,
  onOpenChange,
  onConfirm,
}: CloseInstallmentShellProps) {

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Konfirmasi pelunasan"
      description={installment ? `Tandai ${installment.name} sebagai lunas.` : undefined}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Tindakan ini akan mengubah status cicilan menjadi lunas dan mengatur sisa hutang menjadi 0.
        </p>
        <div className="flex justify-end gap-2">
          <Button onClick={onConfirm} disabled={submitting}>
            {submitting ? "Memproses..." : "Tandai lunas"}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}

export default CloseInstallmentShell;
