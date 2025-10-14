"use client";

import { useMemo } from "react";

import type { InstallmentItem } from "@/hooks/use-installments";

import InstallmentFormShell, { type InstallmentFormValues } from "./installment-form-shell";

interface InstallmentEditShellProps {
  open: boolean;
  submitting: boolean;
  installment: InstallmentItem | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InstallmentFormValues) => Promise<void> | void;
}

function mapInstallmentToFormValues(installment: InstallmentItem | null): InstallmentFormValues | undefined {
  if (!installment) {
    return undefined;
  }

  return {
    name: installment.name ?? "",
    type: installment.type ?? "",
    provider: installment.provider ?? "",
    monthlyAmount:
      installment.monthlyAmount === null || installment.monthlyAmount === undefined
        ? ""
        : String(installment.monthlyAmount),
    remainingAmount:
      installment.remainingAmount === null || installment.remainingAmount === undefined
        ? ""
        : String(installment.remainingAmount),
    remainingPayments:
      installment.remainingPayments === null || installment.remainingPayments === undefined
        ? ""
        : String(installment.remainingPayments),
    dueDate: installment.dueDate ? installment.dueDate.split("T")[0] ?? installment.dueDate : "",
  };
}

function InstallmentEditShell({ open, submitting, installment, onOpenChange, onSubmit }: InstallmentEditShellProps) {
  const initialValues = useMemo(() => mapInstallmentToFormValues(installment), [installment]);

  return (
    <InstallmentFormShell
      open={open}
      submitting={submitting}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      initialValues={initialValues}
      title="Edit cicilan"
      description="Perbarui detail cicilan kamu biar selalu akurat."
      submitLabel="Simpan perubahan"
      submittingLabel="Menyimpan..."
    />
  );
}

export default InstallmentEditShell;
