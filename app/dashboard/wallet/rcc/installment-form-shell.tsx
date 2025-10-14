"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { ModalShell } from "@/components/dashboard/modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/currency-input";
import { DatePicker } from "@/components/date-picker";

export interface InstallmentFormValues {
  name: string;
  type: string;
  provider: string;
  monthlyAmount: string;
  remainingAmount: string;
  remainingPayments: string;
  dueDate: string;
}

interface InstallmentFormShellProps {
  open: boolean;
  submitting: boolean;
  title: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  cancelLabel?: string;
  initialValues?: InstallmentFormValues;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: InstallmentFormValues) => Promise<void> | void;
}

function createDefaultValues(): InstallmentFormValues {
  return {
    name: "",
    type: "",
    provider: "",
    monthlyAmount: "",
    remainingAmount: "",
    remainingPayments: "",
    dueDate: new Date().toISOString().split("T")[0],
  };
}

function InstallmentFormShell({
  open,
  submitting,
  title,
  description,
  submitLabel,
  submittingLabel,
  cancelLabel = "Batal",
  initialValues,
  onOpenChange,
  onSubmit,
}: InstallmentFormShellProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState,
  } = useForm<InstallmentFormValues>({
    defaultValues: initialValues ?? createDefaultValues(),
  });

  const { errors, dirtyFields } = formState;

  const monthlyAmountValue = watch("monthlyAmount");
  const remainingAmountValue = watch("remainingAmount");
  const remainingPaymentsValue = watch("remainingPayments");
  const hasManualRemainingPayments = Boolean(dirtyFields?.remainingPayments);
  const hasManualRemainingAmount = Boolean(dirtyFields?.remainingAmount);

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(initialValues ?? createDefaultValues());
  }, [open, initialValues, reset]);

  useEffect(() => {
    const hasMonthly = monthlyAmountValue?.trim();
    const hasRemaining = remainingAmountValue?.trim();

    if (!hasMonthly || !hasRemaining || hasManualRemainingPayments) {
      return;
    }

    const monthly = Number(monthlyAmountValue);
    const remaining = Number(remainingAmountValue);
    if (!Number.isFinite(monthly) || monthly <= 0 || !Number.isFinite(remaining) || remaining <= 0) {
      return;
    }

    if (!Number.isFinite(monthly) || monthly <= 0 || !Number.isFinite(remaining) || remaining <= 0) {
      return;
    }

    const estimatedPayments = Math.max(1, Math.round(remaining / monthly));
    const estimatedString = estimatedPayments.toString();
    if (estimatedString !== remainingPaymentsValue) {
      setValue("remainingPayments", estimatedString, { shouldDirty: false });
    }
  }, [monthlyAmountValue, remainingAmountValue, remainingPaymentsValue, hasManualRemainingPayments, setValue]);

  useEffect(() => {
    const hasMonthly = monthlyAmountValue?.trim();
    const hasRemainingPayments = remainingPaymentsValue?.trim();

    if (!hasMonthly || !hasRemainingPayments || hasManualRemainingAmount) {
      return;
    }

    const monthly = Number(monthlyAmountValue);
    const payments = Number(remainingPaymentsValue);
    if (!Number.isFinite(monthly) || monthly <= 0 || !Number.isFinite(payments) || payments <= 0) {
      return;
    }

    const estimatedRemaining = monthly * payments;
    const estimatedString = estimatedRemaining.toString();
    if (estimatedString !== remainingAmountValue) {
      setValue("remainingAmount", estimatedString, { shouldDirty: false });
    }
  }, [monthlyAmountValue, remainingPaymentsValue, remainingAmountValue, hasManualRemainingAmount, setValue]);

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <ModalShell open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="installment-name">Nama cicilan</Label>
          <Input
            id="installment-name"
            placeholder="Contoh: Kredit kendaraan"
            aria-invalid={Boolean(errors.name)}
            {...register("name", { required: true })}
          />
          {errors.name ? (
            <p className="text-xs text-destructive">Nama cicilan wajib diisi.</p>
          ) : (
            <p className="text-xs text-muted-foreground">Kasih nama yang mudah kamu kenali nantinya.</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="installment-type">Jenis cicilan</Label>
            <Input id="installment-type" placeholder="Contoh: Kendaraan" {...register("type")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installment-provider">Penyedia (opsional)</Label>
            <Input id="installment-provider" placeholder="Contoh: Mandiri Finance" {...register("provider")} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={control}
            name="monthlyAmount"
            rules={{ required: true }}
            render={({ field: { value, onChange, onBlur } }) => (
              <div className="space-y-2">
                <Label htmlFor="installment-monthly">Tagihan per bayar (IDR)</Label>
                <CurrencyInput
                  id="installment-monthly"
                  value={value}
                  onValueChange={onChange}
                  onBlur={onBlur}
                  placeholder="0"
                  allowClear
                  clearLabel="Kosongkan tagihan per bayar"
                  isRequired
                  aria-invalid={Boolean(errors.monthlyAmount)}
                />
                {errors.monthlyAmount ? (
                  <p className="text-xs text-destructive">Isi nominal pembayaran tiap periode.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Nominal yang kamu bayarkan di setiap periode.</p>
                )}
              </div>
            )}
          />
          <Controller
            control={control}
            name="remainingAmount"
            rules={{ required: true }}
            render={({ field: { value, onChange, onBlur } }) => (
              <div className="space-y-2">
                <Label htmlFor="installment-remaining">Sisa tagihan (IDR)</Label>
                <CurrencyInput
                  id="installment-remaining"
                  value={value}
                  onValueChange={onChange}
                  onBlur={onBlur}
                  placeholder="0"
                  allowClear
                  clearLabel="Kosongkan sisa tagihan"
                  isRequired
                  aria-invalid={Boolean(errors.remainingAmount)}
                />
                {errors.remainingAmount ? (
                  <p className="text-xs text-destructive">Masukkan total sisa tagihan yang belum dibayar.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Total outstanding cicilan yang masih harus dibayar.</p>
                )}
              </div>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="installment-remaining-payments">Sisa kali bayar</Label>
          <Input
            id="installment-remaining-payments"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="Contoh: 12"
            aria-invalid={Boolean(errors.remainingPayments)}
            {...register("remainingPayments")}
          />
          {errors.remainingPayments ? (
            <p className="text-xs text-destructive">Pastikan sisa kali bayar berupa angka.</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Kalau kosong, kami bantu hitung dari nominal tagihan dan sisa total otomatis.
            </p>
          )}
        </div>
        <Controller
          control={control}
          name="dueDate"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <div className="space-y-2">
              <Label htmlFor="installment-due">Tanggal jatuh tempo</Label>
              <DatePicker
                id="installment-due"
                value={value}
                onChange={(next) => onChange(next)}
                allowClear={false}
                isRequired
                aria-invalid={Boolean(errors.dueDate)}
              />
              {errors.dueDate ? (
                <p className="text-xs text-destructive">Pilih tanggal jatuh tempo cicilan.</p>
              ) : (
                <p className="text-xs text-muted-foreground">Tanggal pembayaran berikutnya untuk cicilan ini.</p>
              )}
            </div>
          )}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? submittingLabel : submitLabel}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {cancelLabel}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

export default InstallmentFormShell;
