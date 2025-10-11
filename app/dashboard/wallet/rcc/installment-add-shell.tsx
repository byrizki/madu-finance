"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { ModalShell } from "@/components/dashboard/modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/currency-input";
import { DatePicker } from "@/components/date-picker";

export interface AddInstallmentFormValues {
  name: string;
  type: string;
  provider: string;
  monthlyAmount: string;
  remainingAmount: string;
  dueDate: string;
}

interface AddInstallmentShellProps {
  open: boolean;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AddInstallmentFormValues) => Promise<void> | void;
}

function AddInstallmentShell({ open, submitting, onOpenChange, onSubmit }: AddInstallmentShellProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
  } = useForm<AddInstallmentFormValues>({
    defaultValues: {
      name: "",
      type: "",
      provider: "",
      monthlyAmount: "",
      remainingAmount: "",
      dueDate: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        name: "",
        type: "",
        provider: "",
        monthlyAmount: "",
        remainingAmount: "",
        dueDate: new Date().toISOString().split("T")[0],
      });
    }
  }, [open, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah cicilan"
      description="Catat kewajiban cicilan baru Anda."
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="installment-name">Nama cicilan</Label>
          <Input id="installment-name" placeholder="Contoh: Kredit kendaraan" {...register("name", { required: true })} />
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
                <Label htmlFor="installment-monthly">Cicilan bulanan (IDR)</Label>
                <CurrencyInput
                  id="installment-monthly"
                  value={value}
                  onValueChange={onChange}
                  onBlur={onBlur}
                  placeholder="0"
                  allowClear
                  clearLabel="Kosongkan cicilan bulanan"
                  isRequired
                />
              </div>
            )}
          />
          <Controller
            control={control}
            name="remainingAmount"
            rules={{ required: true }}
            render={({ field: { value, onChange, onBlur } }) => (
              <div className="space-y-2">
                <Label htmlFor="installment-remaining">Sisa hutang (IDR)</Label>
                <CurrencyInput
                  id="installment-remaining"
                  value={value}
                  onValueChange={onChange}
                  onBlur={onBlur}
                  placeholder="0"
                  allowClear
                  clearLabel="Kosongkan sisa hutang"
                  isRequired
                />
              </div>
            )}
          />
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
              />
            </div>
          )}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Menyimpan..." : "Simpan cicilan"}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Batal
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

export default AddInstallmentShell;
