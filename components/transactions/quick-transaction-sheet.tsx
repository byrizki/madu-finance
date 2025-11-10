"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModalShell } from "@/components/dashboard/modal-shell";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useForm } from "react-hook-form";

import { createTransaction, updateTransaction } from "@/utils/transactions-service";
import type { TransactionType } from "@/lib/db/types";
import type { TransactionItem } from "@/hooks/use-transactions";
import {
  NO_WALLET_OPTION_VALUE,
  TransactionFormFields,
  type TransactionFormValues,
  type TransactionFormWalletOption,
} from "@/components/transactions/transaction-form";
import { useWallets } from "@/hooks/use-wallets";

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
  walletId: NO_WALLET_OPTION_VALUE,
});

const getValuesFromTransaction = (transaction: TransactionItem): TransactionFormValues => ({
  title: transaction.title,
  amount: Math.abs(transaction.amount).toString(),
  category: transaction.category,
  description: transaction.description ?? "",
  date: (transaction.occurredAt ?? transaction.createdAt).slice(0, 10),
  walletId: transaction.walletId ?? NO_WALLET_OPTION_VALUE,
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

  const { data: wallets, isLoading: walletsLoading } = useWallets(accountSlug);

  const walletOptions = useMemo<TransactionFormWalletOption[]>(
    () => {
      const list = (wallets ?? []).map((wallet) => ({
        id: wallet.id,
        name: wallet.name,
        type: wallet.type,
        color: wallet.color,
        provider: wallet.provider,
      }));

      if (transaction?.wallet && !list.some((item) => item.id === transaction.wallet?.id)) {
        const fallbackProvider = wallets?.find((wallet) => wallet.id === transaction.wallet?.id)?.provider ?? null;
        list.push({
          id: transaction.wallet.id,
          name: transaction.wallet.name,
          type: transaction.wallet.type,
          color: transaction.wallet.color,
          provider: fallbackProvider,
        });
      }

      return list;
    },
    [wallets, transaction?.wallet],
  );

  useEffect(() => {
    if (isEditing) {
      return;
    }

    if (walletOptions.length === 0) {
      return;
    }

    const currentValue = form.getValues("walletId");
    if (currentValue === NO_WALLET_OPTION_VALUE) {
      form.setValue("walletId", walletOptions[0]?.id ?? NO_WALLET_OPTION_VALUE, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [form, isEditing, walletOptions]);

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
      walletId: string | null;
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
            walletId: payload.walletId,
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
          walletId: payload.walletId,
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

      const normalizedWalletId = values.walletId === NO_WALLET_OPTION_VALUE ? null : values.walletId;

      await mutation.mutateAsync({
        type: activeType,
        title: values.title.trim(),
        amount: parsedAmount,
        category: values.category,
        occurredAt,
        description: showDescriptionField ? values.description.trim() || undefined : undefined,
        walletId: normalizedWalletId,
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

          <TransactionFormFields
            form={form}
            accountSlug={accountSlug}
            transactionType={activeType}
            walletOptions={walletOptions}
            walletsLoading={walletsLoading}
            isSubmitting={mutation.isPending}
            showDateField={showDateField}
            showDescriptionField={showDescriptionField}
            fallbackCategories={fallbackCategories}
          />
        </form>
      </Form>
    </ModalShell>
  );
}
