"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { ModalShell } from "@/components/dashboard/modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";

import type { WalletItem } from "@/hooks/use-wallets";

import { formatWalletCurrency, manualWalletOptionValue } from "./wallet-utils";

export interface AddBalanceFormValues {
  walletId: string;
  sourceWalletId: string;
  amount: string;
  note: string;
}

interface AddBalanceShellProps {
  open: boolean;
  submitting: boolean;
  walletList: WalletItem[];
  selectedWalletId: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: AddBalanceFormValues) => Promise<void> | void;
}

function AddBalanceShell({ open, submitting, walletList, selectedWalletId, onOpenChange, onSubmit }: AddBalanceShellProps) {
  const isMobile = useIsMobile();

  const { control, handleSubmit, reset, watch, setValue } = useForm<AddBalanceFormValues>({
    defaultValues: {
      walletId: "",
      sourceWalletId: manualWalletOptionValue,
      amount: "",
      note: "",
    },
  });

  const watchedWalletId = watch("walletId");
  const selectedWallet = useMemo(
    () => walletList.find((wallet) => wallet.id === (watchedWalletId || selectedWalletId || "")) ?? null,
    [walletList, watchedWalletId, selectedWalletId]
  );

  useEffect(() => {
    if (open) {
      reset({
        walletId: selectedWalletId ?? "",
        sourceWalletId: manualWalletOptionValue,
        amount: "",
        note: "",
      });
    }
  }, [open, selectedWalletId, reset]);

  useEffect(() => {
    if (open && selectedWalletId) {
      setValue("walletId", selectedWalletId);
    }
  }, [open, selectedWalletId, setValue]);

  useEffect(() => {
    if (!open) {
      reset({
        walletId: "",
        sourceWalletId: manualWalletOptionValue,
        amount: "",
        note: "",
      });
    }
  }, [open, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    const payload: AddBalanceFormValues = {
      ...values,
      sourceWalletId: values.sourceWalletId === manualWalletOptionValue ? "" : values.sourceWalletId,
    };
    await onSubmit(payload);
  });

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Tambah saldo"
      description={selectedWallet ? `Tambah saldo untuk ${selectedWallet.name}.` : "Pilih dompet tujuan."}
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Dompet tujuan</Label>
          <Controller
            control={control}
            name="walletId"
            rules={{ required: true }}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                  if (value === field.value) return;
                  setValue("sourceWalletId", manualWalletOptionValue);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dompet" />
                </SelectTrigger>
                <SelectContent>
                  {walletList.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name} • {formatWalletCurrency(wallet.balance)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label>Dompet asal (opsional)</Label>
          <Controller
            control={control}
            name="sourceWalletId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dompet asal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={manualWalletOptionValue}>Penambahan manual</SelectItem>
                  {walletList
                    .filter((wallet) => wallet.id !== watch("walletId"))
                    .map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} • {formatWalletCurrency(wallet.balance)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="increase-note">Catatan (opsional)</Label>
          <Controller
            control={control}
            name="note"
            render={({ field }) => (
              <Textarea
                id="increase-note"
                placeholder="Contoh: Penyesuaian saldo akhir bulan"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="increase-amount">Jumlah penambahan (IDR)</Label>
          <Controller
            control={control}
            name="amount"
            rules={{ required: true, min: 1 }}
            render={({ field }) => (
              <Input
                id="increase-amount"
                type="number"
                min="1"
                placeholder="0"
                value={field.value}
                onChange={field.onChange}
                required
              />
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Memproses..." : "Tambah saldo"}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

export default AddBalanceShell;
