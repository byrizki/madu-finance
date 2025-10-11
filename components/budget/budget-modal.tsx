"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ModalShell } from "@/components/dashboard/modal-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import type { BudgetPeriod } from "@/lib/db/types";
import { CategoryAutocompleteInput } from "@/components/category/category-autocomplete-input";
import { DatePicker } from "@/components/date-picker";
import { CurrencyInput } from "@/components/currency-input";

interface BudgetModalProps {
  accountSlug?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface BudgetFormState {
  category: string;
  amount: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
}

const categories = [
  "Makanan & Minuman",
  "Transportasi",
  "Tagihan",
  "Hiburan",
  "Belanja",
  "Kesehatan",
  "Edukasi",
  "Investasi",
  "Lainnya",
];

const periodOptions: { value: BudgetPeriod; label: string }[] = [
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "quarterly", label: "Triwulan" },
  { value: "yearly", label: "Tahunan" },
];

const getDefaultFormState = (): BudgetFormState => ({
  category: "",
  amount: "",
  period: "monthly",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
});

export function BudgetModal({ accountSlug, isOpen, onClose }: BudgetModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BudgetFormState>(getDefaultFormState);

  useEffect(() => {
    if (!isOpen) {
      setFormData(getDefaultFormState());
    }
  }, [isOpen]);

  const mutation = useMutation({
    mutationFn: async (payload: {
      category: string;
      amount: number;
      period: BudgetPeriod;
      startDate: string;
      endDate: string | null;
    }) => {
      if (!accountSlug) {
        throw new Error("Kas belum siap. Coba lagi nanti.");
      }

      const response = await fetch(`/api/${accountSlug}/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Gagal membuat anggaran");
      }

      return response.json() as Promise<{ budget: { id: string } }>;
    },
    onSuccess: async () => {
      if (accountSlug) {
        await queryClient.invalidateQueries({ queryKey: ["budgets", accountSlug] });
      }
      toast.success("Anggaran dibuat", {
        description: "Anggaran baru berhasil ditambahkan.",
      });
      onClose();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error("Gagal membuat anggaran", {
        description: message,
      });
    },
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.category) {
      toast.error("Kategori wajib diisi");
      return;
    }

    const parsedAmount = Number(formData.amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Nominal tidak valid", {
        description: "Masukkan angka lebih besar dari nol.",
      });
      return;
    }

    if (!formData.startDate) {
      toast.error("Tanggal mulai wajib diisi");
      return;
    }

    if (formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("Rentang tanggal tidak valid", {
        description: "Tanggal selesai harus setelah tanggal mulai.",
      });
      return;
    }

    await mutation.mutateAsync({
      category: formData.category,
      amount: parsedAmount,
      period: formData.period,
      startDate: formData.startDate,
      endDate: formData.endDate ? formData.endDate : null,
    });
  };

  return (
    <ModalShell
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title="Buat anggaran"
      description="Tentukan kategori, nominal, dan periode anggaran Anda."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="budget-category">Kategori</Label>
          <CategoryAutocompleteInput
            id="budget-category"
            accountSlug={accountSlug}
            value={formData.category}
            onChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
            fallback={categories}
            placeholder="Ketik atau pilih kategori"
            disabled={mutation.isPending}
            suggestionsLimit={15}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget-amount">Jumlah anggaran (IDR)</Label>
          <CurrencyInput
            id="budget-amount"
            value={formData.amount}
            onValueChange={(next) => setFormData((prev) => ({ ...prev, amount: next }))}
            placeholder="0"
            allowClear
            clearLabel="Kosongkan nominal"
            disabled={mutation.isPending}
            inputClassName="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget-period">Periode</Label>
          <Select value={formData.period} onValueChange={(value: BudgetPeriod) => setFormData((prev) => ({ ...prev, period: value }))}>
            <SelectTrigger id="budget-period" className="h-11 rounded-2xl border-border/60 bg-background/80">
              <SelectValue placeholder="Pilih periode" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="budget-start-date">Tanggal mulai</Label>
            <DatePicker
              id="budget-start-date"
              value={formData.startDate}
              onChange={(next) => setFormData((prev) => ({ ...prev, startDate: next }))}
              max={formData.endDate || undefined}
              allowClear
              clearLabel="Kosongkan tanggal mulai"
              isRequired
              disabled={mutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget-end-date">Tanggal akhir (opsional)</Label>
            <DatePicker
              id="budget-end-date"
              value={formData.endDate}
              onChange={(next) => setFormData((prev) => ({ ...prev, endDate: next }))}
              min={formData.startDate || undefined}
              allowClear
              clearLabel="Kosongkan tanggal akhir"
              disabled={mutation.isPending}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
            {mutation.isPending ? "Menyimpan..." : "Simpan anggaran"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Batal
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
