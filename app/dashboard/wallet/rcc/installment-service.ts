"use client";

import type { QueryClient } from "@tanstack/react-query";

import type { InstallmentFormValues } from "./installment-form-shell";
import type { ServiceResult } from "./service-types";

interface SubmitAddInstallmentParams {
  accountSlug: string;
  queryClient: QueryClient;
  values: InstallmentFormValues;
}

export async function submitAddInstallment({ accountSlug, queryClient, values }: SubmitAddInstallmentParams): Promise<ServiceResult> {
  const { name, type, provider, monthlyAmount, remainingAmount, remainingPayments, dueDate } = values;

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, error: "Nama cicilan wajib diisi" };
  }

  if (!monthlyAmount.trim() || !remainingAmount.trim()) {
    return {
      success: false,
      error: "Nominal wajib diisi",
      errorDescription: "Nominal tagihan per bayar dan sisa tagihan tidak boleh kosong.",
    };
  }

  const parsedMonthly = Number(monthlyAmount);
  const parsedRemaining = Number(remainingAmount);
  if (Number.isNaN(parsedMonthly) || Number.isNaN(parsedRemaining)) {
    return {
      success: false,
      error: "Nominal tidak valid",
      errorDescription: "Pastikan angka diisi dengan benar.",
    };
  }

  const trimmedRemainingPayments = remainingPayments?.trim() ?? "";
  const parsedRemainingPayments = trimmedRemainingPayments ? Number(trimmedRemainingPayments) : null;
  if (trimmedRemainingPayments && Number.isNaN(parsedRemainingPayments)) {
    return {
      success: false,
      error: "Jumlah pembayaran tidak valid",
      errorDescription: "Pastikan sisa kali bayar berupa angka.",
    };
  }

  if (!dueDate || new Date(dueDate).toString() === "Invalid Date") {
    return { success: false, error: "Tanggal jatuh tempo tidak valid" };
  }

  try {
    const response = await fetch(`/api/${accountSlug}/installments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmedName,
        type: type?.trim() || "lainnya",
        provider: provider?.trim() || null,
        monthlyAmount: parsedMonthly,
        remainingAmount: parsedRemaining,
        remainingPayments: parsedRemainingPayments,
        dueDate,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Tidak dapat menambah cicilan");
    }

    await queryClient.invalidateQueries({ queryKey: ["installments", accountSlug] });
    return {
      success: true,
      message: "Cicilan ditambahkan",
      description: `${trimmedName} berhasil disimpan.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal menyimpan cicilan baru.";
    return { success: false, error: "Gagal menambah cicilan", errorDescription: message };
  }
}

interface SubmitPayInstallmentParams {
  accountSlug: string;
  queryClient: QueryClient;
  installmentId: string;
  installmentName: string;
}

export async function submitPayInstallment({
  accountSlug,
  queryClient,
  installmentId,
  installmentName,
}: SubmitPayInstallmentParams): Promise<ServiceResult> {
  try {
    const response = await fetch(`/api/${accountSlug}/installments/${installmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "paid",
        remainingAmount: 0,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Tidak dapat memperbarui cicilan");
    }

    await queryClient.invalidateQueries({ queryKey: ["installments", accountSlug] });
    return {
      success: true,
      message: "Cicilan dilunasi",
      description: `${installmentName} ditandai lunas.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tidak dapat memperbarui status cicilan.";
    return { success: false, error: "Gagal melunasi cicilan", errorDescription: message };
  }
}

interface SubmitEditInstallmentParams {
  accountSlug: string;
  queryClient: QueryClient;
  installmentId: string;
  installmentName: string;
  values: InstallmentFormValues;
}

export async function submitEditInstallment({
  accountSlug,
  queryClient,
  installmentId,
  installmentName,
  values,
}: SubmitEditInstallmentParams): Promise<ServiceResult> {
  const { name, type, provider, monthlyAmount, remainingAmount, remainingPayments, dueDate } = values;

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, error: "Nama cicilan wajib diisi" };
  }

  if (!monthlyAmount.trim() || !remainingAmount.trim()) {
    return {
      success: false,
      error: "Nominal wajib diisi",
      errorDescription: "Nominal tagihan per bayar dan sisa tagihan tidak boleh kosong.",
    };
  }

  const parsedMonthly = Number(monthlyAmount);
  const parsedRemaining = Number(remainingAmount);
  if (Number.isNaN(parsedMonthly) || Number.isNaN(parsedRemaining)) {
    return {
      success: false,
      error: "Nominal tidak valid",
      errorDescription: "Pastikan angka diisi dengan benar.",
    };
  }

  const trimmedRemainingPayments = remainingPayments?.trim() ?? "";
  const parsedRemainingPayments = trimmedRemainingPayments ? Number(trimmedRemainingPayments) : null;
  if (trimmedRemainingPayments && Number.isNaN(parsedRemainingPayments)) {
    return {
      success: false,
      error: "Jumlah pembayaran tidak valid",
      errorDescription: "Pastikan sisa kali bayar berupa angka.",
    };
  }

  if (!dueDate || new Date(dueDate).toString() === "Invalid Date") {
    return { success: false, error: "Tanggal jatuh tempo tidak valid" };
  }

  try {
    const response = await fetch(`/api/${accountSlug}/installments/${installmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmedName,
        type: type?.trim() || "lainnya",
        provider: provider?.trim() || null,
        monthlyAmount: parsedMonthly,
        remainingAmount: parsedRemaining,
        remainingPayments: parsedRemainingPayments,
        dueDate,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Tidak dapat memperbarui cicilan");
    }

    await queryClient.invalidateQueries({ queryKey: ["installments", accountSlug] });
    return {
      success: true,
      message: "Cicilan diperbarui",
      description: `${installmentName} berhasil diperbarui.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tidak dapat memperbarui cicilan.";
    return { success: false, error: "Gagal memperbarui cicilan", errorDescription: message };
  }
}
