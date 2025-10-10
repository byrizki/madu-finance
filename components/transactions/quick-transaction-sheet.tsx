"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModalShell } from "@/components/dashboard/modal-shell";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";

import { createTransaction, updateTransaction } from "@/utils/transactions-service";
import type { TransactionType } from "@/lib/db/types";
import type { TransactionItem } from "@/hooks/use-transactions";
import { CategoryAutocompleteInput } from "@/components/category/category-autocomplete-input";

export type QuickTransactionSheetType = "income" | "expense" | "both";

interface QuickTransactionSheetProps {
  accountSlug?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  mode?: QuickTransactionSheetType;
  defaultType?: "income" | "expense";
  className?: string;
  showDescriptionField?: boolean;
  showDateField?: boolean;
  onSuccess?: () => void;
  transaction?: TransactionItem;
  variant?: "create" | "edit";
}

interface TransactionFormValues {
  title: string;
  amount: string;
  category: string;
  description: string;
  date: string;
}

type TransactionTypeValue = "income" | "expense";

const expenseCategoryFallback: ReadonlyArray<string> = [
  "Makanan & Minuman",
  "Transportasi",
  "Tagihan",
  "E-Wallet",
  "Kesehatan",
  "Edukasi",
  "Hiburan",
  "Belanja",
  "Lainnya",
];

const incomeCategoryFallback: ReadonlyArray<string> = [
  "Gaji",
  "Freelance",
  "Investasi",
  "Bonus",
  "Hadiah",
  "Lainnya",
];

const getDefaultValues = (): TransactionFormValues => ({
  title: "",
  amount: "",
  category: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
});

const getValuesFromTransaction = (transaction: TransactionItem): TransactionFormValues => ({
  title: transaction.title,
  amount: Math.abs(transaction.amount).toString(),
  category: transaction.category,
  description: transaction.description ?? "",
  date: (transaction.occurredAt ?? transaction.createdAt).slice(0, 10),
});

export function QuickTransactionSheet({
  accountSlug,
  open,
  onOpenChange,
  title = "Tambah transaksi",
  description = "Catat transaksi baru untuk memperbarui ringkasan keuangan.",
  mode = "both",
  defaultType = "income",
  className,
  showDescriptionField = false,
  showDateField = false,
  onSuccess,
  transaction,
  variant = "create",
}: QuickTransactionSheetProps) {
  const queryClient = useQueryClient();
  const isEditing = variant === "edit" && Boolean(transaction);
  const resolvedDefaultType = useMemo<TransactionTypeValue>(() => {
    if (isEditing && transaction) {
      return transaction.type;
    }
    if (mode === "income") {
      return "income";
    }
    if (mode === "expense") {
      return "expense";
    }
    return defaultType;
  }, [defaultType, mode, isEditing, transaction]);
  const [activeType, setActiveType] = useState<TransactionTypeValue>(resolvedDefaultType);

  const form = useForm<TransactionFormValues>({
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (!isEditing) {
      setActiveType(resolvedDefaultType);
    }
  }, [resolvedDefaultType, isEditing]);

  useEffect(() => {
    if (isEditing && transaction) {
      form.reset(getValuesFromTransaction(transaction));
      setActiveType(transaction.type);
    }
  }, [isEditing, transaction, form]);

  const fallbackCategories = useMemo(
    () => (activeType === "expense" ? expenseCategoryFallback : incomeCategoryFallback),
    [activeType],
  );

  const mutation = useMutation({
    mutationFn: async (payload: {
      type: TransactionTypeValue;
      title: string;
      amount: number;
      category: string;
      occurredAt: string;
      description?: string | null;
    }) => {
      if (!accountSlug) {
        throw new Error("Kas belum siap. Coba lagi nanti.");
      }

      if (isEditing && transaction) {
        return updateTransaction({
          accountSlug,
          transactionId: transaction.id,
          payload: {
            type: payload.type as TransactionType,
            title: payload.title,
            category: payload.category,
            amount: payload.amount,
            occurredAt: payload.occurredAt,
            description: payload.description ?? null,
            walletId: transaction.walletId,
            memberId: transaction.memberId,
          },
        });
      }

      return createTransaction({
        accountSlug,
        payload: {
          type: payload.type as TransactionType,
          title: payload.title,
          category: payload.category,
          amount: payload.amount,
          occurredAt: payload.occurredAt,
          description: payload.description ?? null,
          walletId: null,
          memberId: null,
        },
      });
    },
    onSuccess: async () => {
      if (accountSlug) {
        await queryClient.invalidateQueries({ queryKey: ["transactions", accountSlug] });
      }
      toast.success(isEditing ? "Transaksi diperbarui" : "Transaksi disimpan", {
        description: isEditing ? "Transaksi berhasil diperbarui." : "Transaksi baru berhasil ditambahkan.",
      });
      if (!isEditing) {
        form.reset(getDefaultValues());
      } else if (isEditing && transaction) {
        form.reset(getValuesFromTransaction(transaction));
      }
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error("Gagal menyimpan transaksi", {
        description: message,
      });
    },
  });

  const allowTypeSelection = mode === "both";

  const handleSubmit = useCallback(
    async (values: TransactionFormValues) => {
      const parsedAmount = Number(values.amount);

      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        form.setError("amount", { message: "Masukkan nominal yang valid" });
        return;
      }

      if (!values.category) {
        form.setError("category", { message: "Kategori wajib dipilih" });
        return;
      }

      const baseOccurredAt = isEditing && transaction?.occurredAt ? new Date(transaction.occurredAt) : new Date();
      const occurredAtDate = new Date(baseOccurredAt);

      if (showDateField && values.date) {
        const [year, month, day] = values.date.split("-").map((part) => Number(part));
        if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
          occurredAtDate.setFullYear(year, month - 1, day);
        }
      }

      const occurredAt = occurredAtDate.toISOString();

      await mutation.mutateAsync({
        type: activeType,
        title: values.title.trim(),
        amount: parsedAmount,
        category: values.category,
        occurredAt,
        description: showDescriptionField ? values.description.trim() || undefined : undefined,
      });
    },
    [activeType, form, mutation, showDateField, showDescriptionField],
  );

  const resetFormState = () => {
    if (isEditing && transaction) {
      form.reset(getValuesFromTransaction(transaction));
      setActiveType(transaction.type);
    } else {
      form.reset(getDefaultValues());
      setActiveType(resolvedDefaultType);
    }
  };

  const handleModalOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      mutation.reset();
      resetFormState();
    }
  };

  const modalId = useId();
  const formId = `${modalId}-transaction-form`;

  const footer = (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button type="submit" form={formId} className="sm:flex-1" disabled={mutation.isPending}>
        {mutation.isPending ? "Menyimpan..." : "Simpan"}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="sm:flex-1"
        disabled={mutation.isPending}
        onClick={() => handleModalOpenChange(false)}
      >
        Batal
      </Button>
    </div>
  );

  return (
    <ModalShell
      open={open}
      onOpenChange={handleModalOpenChange}
      title={title}
      description={description}
      footer={footer}
      disableAutoFocus={false}
    >
      <Form {...form}>
        <form id={formId} className={cn("flex flex-col gap-4", className)} onSubmit={form.handleSubmit(handleSubmit)}>
          {allowTypeSelection && (
            <Tabs value={activeType} onValueChange={(value) => setActiveType(value as TransactionTypeValue)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="income" className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Pemasukan
                </TabsTrigger>
                <TabsTrigger value="expense" className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4" />
                  Pengeluaran
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <FormField
            control={form.control}
            name="title"
            rules={{ required: "Nama transaksi wajib diisi" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Gaji bulanan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            rules={{
              required: "Nominal wajib diisi",
              validate: (value) => (Number(value) > 0 ? true : "Masukkan nominal yang valid"),
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nominal</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            rules={{
              required: "Kategori wajib dipilih",
              validate: (value) => (value.trim().length ? true : "Kategori tidak boleh kosong"),
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <FormControl>
                  <CategoryAutocompleteInput
                    accountSlug={accountSlug}
                    value={field.value}
                    onChange={field.onChange}
                    fallback={fallbackCategories}
                    placeholder="Ketik atau pilih kategori"
                    disabled={mutation.isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {showDateField && (
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {showDescriptionField && (
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Tambahkan catatan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </form>
      </Form>
    </ModalShell>
  );
}
