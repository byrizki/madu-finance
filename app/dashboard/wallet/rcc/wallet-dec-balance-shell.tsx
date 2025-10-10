"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { ModalShell } from "@/components/dashboard/modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { WalletItem } from "@/hooks/use-wallets";

import { formatWalletCurrency, manualWalletOptionValue } from "./wallet-utils";

export interface DecreaseBalanceFormValues {
  walletId: string;
  targetWalletId: string;
  amount: string;
  note: string;
}

interface DecreaseBalanceShellProps {
  open: boolean;
  submitting: boolean;
  walletList: WalletItem[];
  selectedWalletId: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: DecreaseBalanceFormValues) => Promise<void> | void;
}

function DecreaseBalanceShell({
  open,
  submitting,
  walletList,
  selectedWalletId,
  onOpenChange,
  onSubmit,
}: DecreaseBalanceShellProps) {
  const { control, handleSubmit, reset, watch, setValue } = useForm<DecreaseBalanceFormValues>({
    defaultValues: {
      walletId: "",
      targetWalletId: manualWalletOptionValue,
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
        targetWalletId: manualWalletOptionValue,
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
        targetWalletId: manualWalletOptionValue,
        amount: "",
        note: "",
      });
    }
  }, [open, reset]);

  const handleFormSubmit = handleSubmit(async (values) => {
    const payload: DecreaseBalanceFormValues = {
      ...values,
      targetWalletId: values.targetWalletId === manualWalletOptionValue ? "" : values.targetWalletId,
    };
    await onSubmit(payload);
  });

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Kurangi saldo"
      description={selectedWallet ? `Kurangi saldo dari ${selectedWallet.name}.` : "Pilih dompet sumber."}
    >
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Dompet sumber</Label>
          <Controller
            control={control}
            name="walletId"
            rules={{ required: true }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
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
          <Label>Dompet tujuan (opsional)</Label>
          <Controller
            control={control}
            name="targetWalletId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dompet tujuan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={manualWalletOptionValue}>Pengurangan manual</SelectItem>
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
          <Label htmlFor="decrease-note">Catatan (opsional)</Label>
          <Controller
            control={control}
            name="note"
            render={({ field }) => (
              <Textarea
                id="decrease-note"
                placeholder="Catatan penyesuaian saldo"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="decrease-amount">Jumlah pengurangan (IDR)</Label>
          <Controller
            control={control}
            name="amount"
            rules={{ required: true, min: 1 }}
            render={({ field }) => (
              <Input
                id="decrease-amount"
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
            {submitting ? "Memproses..." : "Kurangi saldo"}
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}

export default DecreaseBalanceShell;
