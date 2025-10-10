"use client";

import type { QueryClient } from "@tanstack/react-query";

import type { WalletItem } from "@/hooks/use-wallets";
import { formatCurrency } from "@/lib/utils";

import type { AddBalanceFormValues } from "./wallet-add-balance-shell";
import type { DecreaseBalanceFormValues } from "./wallet-dec-balance-shell";
import type { NewWalletFormValues } from "./wallet-new-shell";
import type { ServiceResult } from "./service-types";
import { walletTypeOptions } from "./wallet-utils";

interface SubmitAddWalletParams {
  accountSlug: string;
  queryClient: QueryClient;
  values: NewWalletFormValues;
}

export async function submitAddWallet({ accountSlug, queryClient, values }: SubmitAddWalletParams): Promise<ServiceResult> {
  const { name, type, provider, accountNumber, balance } = values;
  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, error: "Nama dompet wajib diisi" };
  }

  if (!walletTypeOptions.includes(type)) {
    return {
      success: false,
      error: "Jenis dompet tidak valid",
      errorDescription: "Gunakan salah satu dari bank, e_wallet, credit_card, atau cash.",
    };
  }

  const parsedBalance = Number(balance || "0");
  if (Number.isNaN(parsedBalance)) {
    return {
      success: false,
      error: "Saldo awal tidak valid",
      errorDescription: "Masukkan angka yang sesuai.",
    };
  }

  try {
    const response = await fetch(`/api/${accountSlug}/wallets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmedName,
        type,
        provider: provider?.trim() || null,
        accountNumber: accountNumber?.trim() || null,
        balance: parsedBalance,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Gagal menambah dompet");
    }

    await queryClient.invalidateQueries({ queryKey: ["wallets", accountSlug] });
    return {
      success: true,
      message: "Dompet ditambahkan",
      description: `${trimmedName} siap digunakan.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tidak dapat menambah dompet baru.";
    return { success: false, error: "Gagal menambah dompet", errorDescription: message };
  }
}

interface SubmitIncreaseBalanceParams {
  accountSlug: string;
  queryClient: QueryClient;
  walletList: WalletItem[];
  values: AddBalanceFormValues;
}

export async function submitIncreaseBalance({
  accountSlug,
  queryClient,
  walletList,
  values,
}: SubmitIncreaseBalanceParams): Promise<ServiceResult> {
  const { walletId, sourceWalletId, amount, note } = values;
  const targetWallet = walletList.find((wallet) => wallet.id === walletId);

  if (!targetWallet) {
    return { success: false, error: "Pilih dompet tujuan" };
  }

  const parsedAmount = Number(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return {
      success: false,
      error: "Jumlah tidak valid",
      errorDescription: "Masukkan angka lebih dari nol.",
    };
  }

  const sourceWallet = sourceWalletId ? walletList.find((wallet) => wallet.id === sourceWalletId) : null;

  if (sourceWallet && sourceWallet.id === targetWallet.id) {
    return { success: false, error: "Dompet asal dan tujuan tidak boleh sama" };
  }

  if (sourceWallet && sourceWallet.balance < parsedAmount) {
    return {
      success: false,
      error: "Saldo sumber tidak mencukupi",
      errorDescription: `${sourceWallet.name} hanya memiliki saldo ${formatCurrency(sourceWallet.balance)}.`,
    };
  }

  try {
    const payload = {
      amount: parsedAmount,
      note: note?.trim() || null,
    };

    const response = await fetch(
      sourceWallet
        ? `/api/${accountSlug}/wallets/transfer`
        : `/api/${accountSlug}/wallets/${targetWallet.id}/adjust`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          sourceWallet
            ? {
                ...payload,
                sourceWalletId: sourceWallet.id,
                targetWalletId: targetWallet.id,
              }
            : {
                ...payload,
                action: "increase",
              }
        ),
      }
    );

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Tidak dapat menambah saldo");
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wallets", accountSlug] }),
      queryClient.invalidateQueries({ queryKey: ["transactions", accountSlug] }),
    ]);

    const transferDetail = sourceWallet ? ` dari ${sourceWallet.name}` : "";

    return {
      success: true,
      message: "Saldo bertambah",
      description: `${formatCurrency(parsedAmount)} ditambahkan ke ${targetWallet.name}${transferDetail}.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Penambahan saldo tidak dapat diproses.";
    return { success: false, error: "Gagal menambah saldo", errorDescription: message };
  }
}

interface SubmitDecreaseBalanceParams {
  accountSlug: string;
  queryClient: QueryClient;
  walletList: WalletItem[];
  values: DecreaseBalanceFormValues;
}

export async function submitDecreaseBalance({
  accountSlug,
  queryClient,
  walletList,
  values,
}: SubmitDecreaseBalanceParams): Promise<ServiceResult> {
  const { walletId, targetWalletId, amount, note } = values;
  const sourceWallet = walletList.find((wallet) => wallet.id === walletId);

  if (!sourceWallet) {
    return { success: false, error: "Pilih dompet sumber" };
  }

  const parsedAmount = Number(amount);
  if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    return {
      success: false,
      error: "Jumlah tidak valid",
      errorDescription: "Masukkan angka lebih dari nol.",
    };
  }

  if (sourceWallet.balance < parsedAmount) {
    return {
      success: false,
      error: "Saldo tidak mencukupi",
      errorDescription: `${sourceWallet.name} hanya memiliki saldo ${formatCurrency(sourceWallet.balance)}.`,
    };
  }

  const targetWallet = targetWalletId ? walletList.find((wallet) => wallet.id === targetWalletId) : null;

  if (targetWallet && targetWallet.id === sourceWallet.id) {
    return { success: false, error: "Dompet asal dan tujuan tidak boleh sama" };
  }

  try {
    const payload = {
      amount: parsedAmount,
      note: note?.trim() || null,
    };

    const response = await fetch(
      targetWallet
        ? `/api/${accountSlug}/wallets/transfer`
        : `/api/${accountSlug}/wallets/${sourceWallet.id}/adjust`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          targetWallet
            ? {
                ...payload,
                sourceWalletId: sourceWallet.id,
                targetWalletId: targetWallet.id,
              }
            : {
                ...payload,
                action: "decrease",
              }
        ),
      }
    );

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Tidak dapat mengurangi saldo");
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wallets", accountSlug] }),
      queryClient.invalidateQueries({ queryKey: ["transactions", accountSlug] }),
    ]);

    const transferDetail = targetWallet ? ` ke ${targetWallet.name}` : "";

    return {
      success: true,
      message: "Saldo berkurang",
      description: `${formatCurrency(parsedAmount)} dikurangi dari ${sourceWallet.name}${transferDetail}.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pengurangan saldo tidak dapat diproses.";
    return { success: false, error: "Gagal mengurangi saldo", errorDescription: message };
  }
}
