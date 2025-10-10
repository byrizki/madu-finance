"use client";

import type { QueryClient } from "@tanstack/react-query";

import type { AddInstallmentFormValues } from "./installment-add-shell";
import type { ServiceResult } from "./service-types";

interface SubmitAddInstallmentParams {
  accountSlug: string;
  queryClient: QueryClient;
  values: AddInstallmentFormValues;
}

export async function submitAddInstallment({ accountSlug, queryClient, values }: SubmitAddInstallmentParams): Promise<ServiceResult> {
  const { name, type, provider, monthlyAmount, remainingAmount, dueDate } = values;

  const trimmedName = name.trim();
  if (!trimmedName) {
    return { success: false, error: "Nama cicilan wajib diisi" };
  }

  if (!monthlyAmount.trim() || !remainingAmount.trim()) {
    return {
      success: false,
      error: "Nominal wajib diisi",
      errorDescription: "Nominal cicilan dan sisa hutang tidak boleh kosong.",
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
