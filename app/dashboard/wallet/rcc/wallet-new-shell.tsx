"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

import { ModalShell } from "@/components/dashboard/modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { walletTypeLabel, walletTypeOptions } from "./wallet-utils";

export interface NewWalletFormValues {
  name: string;
  type: (typeof walletTypeOptions)[number];
  provider: string;
  accountNumber: string;
  balance: string;
}

interface NewWalletShellProps {
  open: boolean;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: NewWalletFormValues) => Promise<void> | void;
}

function NewWalletShell({ open, submitting, onOpenChange, onSubmit }: NewWalletShellProps) {
  const { control, handleSubmit, register, reset } = useForm<NewWalletFormValues>({
    defaultValues: {
      name: "",
      type: "bank",
      provider: "",
      accountNumber: "",
      balance: "",
    },
  });

  useEffect(() => {
    if (!open) {
      reset({
        name: "",
        type: "bank",
        provider: "",
        accountNumber: "",
        balance: "",
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
      title="Tambah dompet"
      description="Masukkan informasi dompet baru untuk akun Anda."
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="wallet-name">Nama dompet</Label>
          <Input
            id="wallet-name"
            placeholder="Contoh: Tabungan utama"
            {...register("name", { required: true })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Jenis dompet</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis dompet" />
                </SelectTrigger>
                <SelectContent>
                  {walletTypeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {walletTypeLabel[option] ?? option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wallet-provider">Penyedia (opsional)</Label>
            <Input id="wallet-provider" placeholder="Contoh: BCA" {...register("provider")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wallet-account">Nomor akun (opsional)</Label>
            <Input id="wallet-account" placeholder="1234567890" {...register("accountNumber")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wallet-balance">Saldo awal (IDR)</Label>
          <Input id="wallet-balance" type="number" min="0" placeholder="0" {...register("balance")} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Menyimpan..." : "Simpan dompet"}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Batal
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

export default NewWalletShell;
