"use client";

import InstallmentFormShell, { type InstallmentFormValues } from "./installment-form-shell";

export type { InstallmentFormValues as AddInstallmentFormValues } from "./installment-form-shell";

interface AddInstallmentShellProps {
  open: boolean;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InstallmentFormValues) => Promise<void> | void;
}

function AddInstallmentShell({ open, submitting, onOpenChange, onSubmit }: AddInstallmentShellProps) {
  return (
    <InstallmentFormShell
      open={open}
      submitting={submitting}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      title="Tambah cicilan"
      description="Catat kewajiban cicilan baru Anda."
      submitLabel="Simpan cicilan"
      submittingLabel="Menyimpan..."
    />
  );
}

export default AddInstallmentShell;
