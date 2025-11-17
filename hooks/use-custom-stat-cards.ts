"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CustomStatCard, CreateCustomStatCard } from "@/app/dashboard/transactions/rcc/custom-stat-types";
import {
  fetchCustomStatCards,
  createCustomStatCard,
  updateCustomStatCard,
  deleteCustomStatCard,
} from "@/app/dashboard/transactions/rcc/custom-stat-utils";

export function useCustomStatCards(accountSlug?: string) {
  return useQuery<CustomStatCard[], Error>({
    queryKey: ["custom-stat-cards", accountSlug],
    enabled: Boolean(accountSlug),
    queryFn: () => fetchCustomStatCards(accountSlug!),
    retry: (failureCount, error) => {
      // Retry up to 3 times, but not for 4xx errors
      if (error?.message?.includes('404') || error?.message?.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateCustomStatCard(accountSlug?: string) {
  const queryClient = useQueryClient();
  
  return useMutation<CustomStatCard, Error, CreateCustomStatCard>({
    mutationFn: (card) => createCustomStatCard(accountSlug!, card),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-stat-cards", accountSlug] });
      toast.success("Stat card berhasil dibuat");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Gagal membuat stat card";
      toast.error("Error membuat stat card", { 
        description: message,
        action: {
          label: "Coba lagi",
          onClick: () => window.location.reload()
        }
      });
    },
  });
}

export function useUpdateCustomStatCard(accountSlug?: string) {
  const queryClient = useQueryClient();
  
  return useMutation<CustomStatCard, Error, CustomStatCard>({
    mutationFn: (card) => updateCustomStatCard(accountSlug!, card),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-stat-cards", accountSlug] });
      toast.success("Stat card berhasil diperbarui");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Gagal memperbarui stat card";
      toast.error("Error memperbarui stat card", { 
        description: message,
        action: {
          label: "Coba lagi",
          onClick: () => window.location.reload()
        }
      });
    },
  });
}

export function useDeleteCustomStatCard(accountSlug?: string) {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: (cardId) => deleteCustomStatCard(accountSlug!, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-stat-cards", accountSlug] });
      toast.success("Stat card berhasil dihapus");
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Gagal menghapus stat card";
      toast.error("Error menghapus stat card", { 
        description: message,
        action: {
          label: "Coba lagi",
          onClick: () => window.location.reload()
        }
      });
    },
  });
}
