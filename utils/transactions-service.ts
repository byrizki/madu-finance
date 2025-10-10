"use client";

import type { TransactionType } from "@/lib/db/types";

type CreateTransactionPayload = {
  type: TransactionType;
  title: string;
  category: string;
  amount: number;
  occurredAt: string;
  description?: string | null;
  walletId?: string | null;
  memberId?: string | null;
};

type CreateTransactionParams = {
  accountSlug: string;
  payload: CreateTransactionPayload;
};

type CreateTransactionResponse = {
  transaction: {
    id: string;
  };
};

type ApiErrorResponse = {
  error?: string;
};

export async function createTransaction({ accountSlug, payload }: CreateTransactionParams): Promise<CreateTransactionResponse> {
  const response = await fetch(`/api/${accountSlug}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(data?.error ?? "Gagal menyimpan transaksi");
  }

  return response.json() as Promise<CreateTransactionResponse>;
}

export type { CreateTransactionPayload, CreateTransactionParams, CreateTransactionResponse };

type UpdateTransactionPayload = Partial<CreateTransactionPayload> & {
  amount?: number;
  occurredAt?: string;
};

type UpdateTransactionParams = {
  accountSlug: string;
  transactionId: string;
  payload: UpdateTransactionPayload;
};

type UpdateTransactionResponse = {
  transaction: {
    id: string;
  };
};

export async function updateTransaction({ accountSlug, transactionId, payload }: UpdateTransactionParams): Promise<UpdateTransactionResponse> {
  const response = await fetch(`/api/${accountSlug}/transactions/${transactionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(data?.error ?? "Gagal memperbarui transaksi");
  }

  return response.json() as Promise<UpdateTransactionResponse>;
}

type DeleteTransactionParams = {
  accountSlug: string;
  transactionId: string;
};

export async function deleteTransaction({ accountSlug, transactionId }: DeleteTransactionParams): Promise<void> {
  const response = await fetch(`/api/${accountSlug}/transactions/${transactionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(data?.error ?? "Gagal menghapus transaksi");
  }
}

export type { UpdateTransactionParams, UpdateTransactionResponse, DeleteTransactionParams };
