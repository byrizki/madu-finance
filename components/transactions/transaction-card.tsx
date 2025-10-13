"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ArrowDownRight, ArrowUpRight, Clock, Pencil, Trash2, User, Wallet } from "lucide-react";

import { MaskedValue } from "@/components/dashboard/masked-value";
import { ModalShell } from "@/components/dashboard/modal-shell";
import { useShowValues } from "@/components/providers/show-values-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  NO_WALLET_OPTION_VALUE,
  TransactionFormFields,
  type TransactionFormValues,
  type TransactionFormWalletOption,
} from "@/components/transactions/transaction-form";
import type { TransactionItem } from "@/hooks/use-transactions";
import { cn, formatCurrency, getRelativeTime } from "@/lib/utils";
import { useWallets } from "@/hooks/use-wallets";

interface TransactionCardProps {
  transaction: TransactionItem;
  className?: string;
  onEdit?: (updated: TransactionItem) => void | Promise<void>;
  onDelete?: (transaction: TransactionItem) => void | Promise<void>;
  accountSlug?: string;
}

const formatDateInputValue = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const buildEditDefaults = (transaction: TransactionItem): TransactionFormValues => ({
  title: transaction.title,
  amount: Math.abs(transaction.amount).toString(),
  category: transaction.category,
  description: transaction.description ?? "",
  date: formatDateInputValue(transaction.occurredAt ?? transaction.createdAt),
  walletId: transaction.walletId ?? NO_WALLET_OPTION_VALUE,
});

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

export function TransactionCard({ transaction, className, onEdit, onDelete, accountSlug }: TransactionCardProps) {
  const { showValues } = useShowValues();
  const isIncome = transaction.type === "income";
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
  const amount = Math.abs(transaction.amount);
  const occurredAt = transaction.occurredAt ?? transaction.createdAt;

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [restoreDetailOnEditClose, setRestoreDetailOnEditClose] = useState(false);
  const [restoreDetailOnDeleteClose, setRestoreDetailOnDeleteClose] = useState(false);

  const actor = transaction.latestActivity;
  const hasEdit = Boolean(onEdit);
  const hasDelete = Boolean(onDelete);

  const defaultValues = useMemo(() => buildEditDefaults(transaction), [transaction]);

  const editForm = useForm<TransactionFormValues>({
    defaultValues,
  });

  const { data: walletList, isLoading: walletsLoading } = useWallets(accountSlug);

  const walletOptions = useMemo<TransactionFormWalletOption[]>(() => {
    const list = (walletList ?? []).map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      type: wallet.type,
      color: wallet.color,
      provider: wallet.provider,
    }));

    if (transaction.wallet && !list.some((item) => item.id === transaction.wallet?.id)) {
      const fallbackProvider = walletList?.find((wallet) => wallet.id === transaction.wallet?.id)?.provider ?? null;
      list.push({
        id: transaction.wallet.id,
        name: transaction.wallet.name,
        type: transaction.wallet.type,
        color: transaction.wallet.color,
        provider: fallbackProvider,
      });
    }

    return list;
  }, [walletList, transaction.wallet]);

  useEffect(() => {
    if (editDialogOpen) {
      editForm.reset(defaultValues);
    }
  }, [editDialogOpen, defaultValues, editForm]);

  const editFormId = `transaction-edit-${transaction.id}`;

  const handleEditSubmit = editForm.handleSubmit(async (values) => {
    if (!onEdit) {
      setEditDialogOpen(false);
      return;
    }

    const parsedAmount = Number(values.amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      editForm.setError("amount", { message: "Masukkan nominal yang valid" });
      return;
    }

    const title = values.title.trim();
    const category = values.category.trim();

    if (!title) {
      editForm.setError("title", { message: "Nama transaksi wajib diisi" });
      return;
    }

    if (!category) {
      editForm.setError("category", { message: "Kategori wajib diisi" });
      return;
    }

    const signedAmount = transaction.type === "income" ? parsedAmount : -parsedAmount;
    const description = values.description.trim();
    const normalizedDate = values.date
      ? new Date(values.date).toISOString()
      : transaction.occurredAt ?? transaction.createdAt;
    const walletId = values.walletId === NO_WALLET_OPTION_VALUE ? null : values.walletId;
    const walletMeta = walletId
      ? walletOptions.find((wallet) => wallet.id === walletId) ?? transaction.wallet ?? null
      : null;

    const updatedTransaction: TransactionItem = {
      ...transaction,
      title,
      category,
      amount: signedAmount,
      description: description ? description : null,
      occurredAt: normalizedDate,
      walletId,
      wallet: walletMeta,
    };

    await Promise.resolve(onEdit(updatedTransaction));
    setRestoreDetailOnEditClose(false);
    setEditDialogOpen(false);
  });

  const handleDeleteConfirm = async () => {
    if (!onDelete) {
      setDeleteDialogOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      await Promise.resolve(onDelete(transaction));
      setRestoreDetailOnDeleteClose(false);
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditDialogChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      editForm.reset(defaultValues);
      if (restoreDetailOnEditClose) {
        setDetailDialogOpen(true);
      }
      setRestoreDetailOnEditClose(false);
    }
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setIsDeleting(false);
      if (restoreDetailOnDeleteClose) {
        setDetailDialogOpen(true);
      }
      setRestoreDetailOnDeleteClose(false);
    }
  };

  const openDetailDialog = () => {
    setDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setRestoreDetailOnEditClose(false);
    setRestoreDetailOnDeleteClose(false);
  };

  const handleEditFromDetail = () => {
    setRestoreDetailOnEditClose(true);
    setDetailDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleDeleteFromDetail = () => {
    setRestoreDetailOnDeleteClose(true);
    setDetailDialogOpen(false);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Card
        className={cn("rounded-2xl border border-border/50 bg-card/90 shadow-sm transition hover:shadow-md gap-0 py-0", className)}
      >
        <CardContent className="p-0">
          <button
            type="button"
            onClick={openDetailDialog}
            className="flex w-full items-center gap-4 rounded-2xl p-4 text-left outline-none transition hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full",
                isIncome ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-foreground">{transaction.title}</p>
                <MaskedValue
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-sm font-semibold",
                    showValues && (isIncome ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"),
                    !showValues && "bg-muted/40 text-muted-foreground"
                  )}
                  value={`${isIncome ? "+" : "-"}${formatCurrency(amount)}`}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                  {transaction.category}
                </Badge>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {getRelativeTime(occurredAt)}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {actor?.actorName ?? "-"}
                </span>
              </div>
            </div>
          </button>
        </CardContent>
      </Card>

      <ModalShell
        open={detailDialogOpen}
        onOpenChange={(open) => (open ? openDetailDialog() : closeDetailDialog())}
        title={transaction.title}
        description={isIncome ? "Detail transaksi pemasukan" : "Detail transaksi pengeluaran"}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {hasEdit ? (
              <Button type="button" variant="secondary" onClick={handleEditFromDetail}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit transaksi
              </Button>
            ) : null}
            {hasDelete ? (
              <Button type="button" variant="destructive" onClick={handleDeleteFromDetail}>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus transaksi
              </Button>
            ) : null}
            <Button type="button" variant="ghost" onClick={closeDetailDialog}>
              Tutup
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4">
            <MaskedValue
              className={cn(
                "text-2xl font-semibold",
                showValues && (isIncome ? "text-emerald-600" : "text-rose-600"),
                !showValues && "text-muted-foreground"
              )}
              value={`${isIncome ? "+" : "-"}${formatCurrency(amount)}`}
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {getRelativeTime(occurredAt)}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {actor?.actorName ?? "-"}
              </span>
              <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                {isIncome ? "Pemasukan" : "Pengeluaran"}
              </Badge>
              <span className="flex items-center gap-1">
                <Wallet className="h-3.5 w-3.5" />
                {transaction.wallet?.name ?? transaction.walletId ?? "-"}
              </span>
            </div>
          </div>

          {transaction.description ? (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">Catatan</p>
              <p className="leading-relaxed text-sm text-foreground/90">{transaction.description}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Dibuat</p>
              <p className="text-foreground/90">{formatDateTime(transaction.createdAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Diperbarui</p>
              <p className="text-foreground/90">{formatDateTime(transaction.updatedAt)}</p>
            </div>
            {transaction.walletId ? (
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Wallet</p>
                <p className="text-foreground/90">{transaction.walletId}</p>
              </div>
            ) : null}
          </div>
        </div>
      </ModalShell>

      {hasEdit ? (
        <ModalShell
          open={editDialogOpen}
          onOpenChange={handleEditDialogChange}
          title="Edit transaksi"
          description="Perbarui detail transaksi sebelum menyimpan."
          footer={
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="submit" form={editFormId} disabled={editForm.formState.isSubmitting}>
                {editForm.formState.isSubmitting ? "Menyimpan..." : "Simpan perubahan"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleEditDialogChange(false)}
                disabled={editForm.formState.isSubmitting}
              >
                Batal
              </Button>
            </div>
          }
          disableAutoFocus={false}
        >
          <Form {...editForm}>
            <form id={editFormId} onSubmit={handleEditSubmit} className="space-y-4">
              <TransactionFormFields
                form={editForm}
                accountSlug={accountSlug}
                walletOptions={walletOptions}
                walletsLoading={walletsLoading}
                isSubmitting={editForm.formState.isSubmitting}
                showDateField
                showDescriptionField
                fallbackCategories={[transaction.category]}
                walletPlaceholder="Cari atau pilih dompet"
                categoryPlaceholder="Pilih atau ketik kategori"
              />
            </form>
          </Form>
        </ModalShell>
      ) : null}

      {hasDelete ? (
        <AlertDialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus transaksi?</AlertDialogTitle>
              <AlertDialogDescription>
                Tindakan ini akan menghapus transaksi &quot;{transaction.title}&quot; secara permanen. Anda tidak dapat
                mengurungkan proses ini.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(event) => {
                  event.preventDefault();
                  void handleDeleteConfirm();
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Menghapus..." : "Hapus"}
              </AlertDialogAction>
              <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}
