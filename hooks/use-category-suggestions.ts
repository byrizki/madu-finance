"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseCategorySuggestionsOptions {
  accountSlug?: string;
  search: string;
  transactionType?: "income" | "expense";
  limit?: number;
  fallback?: string[];
}

interface CategorySuggestionsResult {
  suggestions: string[];
  isLoading: boolean;
  error: Error | null;
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

export function useCategorySuggestions({
  accountSlug,
  search,
  transactionType,
  limit = 12,
  fallback = [],
}: UseCategorySuggestionsOptions): CategorySuggestionsResult {
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const debouncedSearch = useDebouncedValue(search.trim(), 250);

  const fetchSuggestions = useCallback(async () => {
    if (!accountSlug) {
      setRemoteSuggestions([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const params = new URLSearchParams();
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }
    if (transactionType) {
      params.set("type", transactionType);
    }
    if (limit) {
      params.set("limit", String(limit));
    }

    const endpoint = `/api/${accountSlug}/categories${params.size ? `?${params.toString()}` : ""}`;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(endpoint, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`Gagal memuat kategori (${response.status})`);
      }

      const data = (await response.json()) as { categories?: string[] };
      setRemoteSuggestions(Array.isArray(data.categories) ? data.categories : []);
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err : new Error("Tidak dapat memuat kategori"));
      setRemoteSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [accountSlug, debouncedSearch, transactionType, limit]);

  useEffect(() => {
    fetchSuggestions();

    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchSuggestions]);

  const suggestions = useMemo(() => {
    const normalizedSearch = debouncedSearch.toLowerCase();
    const unique = new Set<string>();

    const addSuggestion = (value: string) => {
      const normalized = value.trim();
      if (!normalized) return;
      if (normalizedSearch && !normalized.toLowerCase().startsWith(normalizedSearch)) {
        return;
      }
      unique.add(normalized);
    };

    fallback.forEach(addSuggestion);
    remoteSuggestions.forEach(addSuggestion);

    return Array.from(unique).slice(0, limit);
  }, [fallback, remoteSuggestions, debouncedSearch, limit]);

  return {
    suggestions,
    isLoading,
    error,
  };
}
